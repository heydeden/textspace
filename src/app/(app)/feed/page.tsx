'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';
import PostCard from '@/components/PostCard';

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'latest' | 'trending' | 'following'>('latest');
  const [currentUserId, setCurrentUserId] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id); else router.push('/');
    });
  }, []);

  async function loadPosts() {
    setLoading(true);
    const endpoint = tab === 'trending' ? '/api/trending' : tab === 'following' ? '/api/posts?feed=following' : '/api/posts';
    const res = await fetch(endpoint);
    const d = await res.json();
    if (d.data) setPosts(d.data.posts || d.data.posts);
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, [tab]);

  useEffect(() => {
    const handler = () => loadPosts();
    window.addEventListener('post-created', handler);
    return () => window.removeEventListener('post-created', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <div className="flex border-b border-zinc-800 mb-4">
        <button onClick={() => setTab('latest')} className={`flex-1 pb-3 text-sm font-medium transition ${tab === 'latest' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Latest</button>
        <button onClick={() => setTab('trending')} className={`flex-1 pb-3 text-sm font-medium transition inline-flex items-center justify-center gap-1 ${tab === 'trending' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}><Flame className="w-4 h-4 text-orange-400" />Trending</button>
        <button onClick={() => setTab('following')} className={`flex-1 pb-3 text-sm font-medium transition ${tab === 'following' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Following</button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 text-zinc-500">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full mb-3" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">No posts</div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onUpdate={() => loadPosts()} />)
      )}
    </div>
  );
}
