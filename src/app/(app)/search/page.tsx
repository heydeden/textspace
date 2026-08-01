'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import UserIdentity from '@/components/UserIdentity';
import Avatar from '@/components/Avatar';
import { formatCount } from '@/lib/format';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'users' | 'posts'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id);
    });
  }, []);

  const runSearch = useCallback(async (query: string, type: 'users' | 'posts') => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
      const d = await res.json();
      if (d.data) {
        setUsers(d.data.users || []);
        setPosts(d.data.posts || []);
      }
    } finally { setLoading(false); }
  }, []);

  // Init / sync search query from URL (?q=...) — e.g. hashtag clicks land here
  useEffect(() => {
    const fromUrl = () => {
      const urlQ = new URLSearchParams(window.location.search).get('q') || '';
      if (!urlQ) return;
      setQ(urlQ);
      const type: 'users' | 'posts' = urlQ.trim().startsWith('#') ? 'posts' : 'users';
      setTab(type);
      runSearch(urlQ, type);
    };
    fromUrl();
    window.addEventListener('popstate', fromUrl);
    return () => window.removeEventListener('popstate', fromUrl);
  }, [runSearch]);

  const effectiveTab: 'users' | 'posts' = q.trim().startsWith('#') ? 'posts' : tab;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    await runSearch(q, effectiveTab);
  }

  function switchTab(next: 'users' | 'posts') {
    setTab(next);
    if (q.trim()) runSearch(q, next);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users or posts..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition" />
      </form>

      <div className="flex border-b border-zinc-800 mb-4">
        <button onClick={() => switchTab('users')} className={`flex-1 pb-3 text-sm font-medium transition ${effectiveTab === 'users' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Users</button>
        <button onClick={() => switchTab('posts')} className={`flex-1 pb-3 text-sm font-medium transition ${effectiveTab === 'posts' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Posts</button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-8">Searching...</div>
      ) : !searched ? (
        <div className="text-center text-zinc-600 py-8 text-sm">Type a query to search</div>
      ) : effectiveTab === 'users' ? (
        users.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm">No users found</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <Link key={u.id} href={`/profile/${u.username}`}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
                <Avatar style={u.avatar_style} seed={u.avatar_seed} username={u.username} displayName={u.display_name} size="md" />
                <div className="min-w-0">
                  <UserIdentity displayName={u.display_name} verified={u.verified} role={u.role} customRoles={u.custom_roles} pts={u.points} size="md" />
                  <p className="text-zinc-500 text-xs">{formatCount(u.points)} pts</p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        posts.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm">No posts found</div>
        ) : (
          <div>
            {posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onUpdate={() => runSearch(q, 'posts')} />)}
          </div>
        )
      )}
    </div>
  );
}
