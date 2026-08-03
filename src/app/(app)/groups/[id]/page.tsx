'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Lock, Globe, ArrowLeft, Plus, Shield, Trash2, Check, X, UserPlus, LogOut } from 'lucide-react';
import PostCard from '@/components/PostCard';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [tab, setTab] = useState<'feed' | 'members' | 'admin'>('feed');

  const isAdmin = membership?.role === 'admin' && membership?.status === 'active';
  const isActive = membership?.status === 'active';

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id); else router.push('/');
    });
  }, []);

  async function loadGroup() {
    const res = await fetch(`/api/groups/${id}`);
    const d = await res.json();
    if (!d.success) { setError(d.error || 'Failed'); setLoading(false); return; }
    setGroup(d.data.group);
    setMembership(d.data.membership);
    setLoading(false);
  }

  async function loadPosts() {
    const res = await fetch(`/api/posts?group_id=${id}`);
    const d = await res.json();
    if (d.data) setPosts(d.data.posts);
  }

  useEffect(() => { loadGroup(); }, [id]);
  useEffect(() => {
    if (isActive) loadPosts();
  }, [id, isActive]);

  async function join() {
    const res = await fetch(`/api/groups/${id}/members`, { method: 'POST' });
    const d = await res.json();
    if (!d.success) return setError(d.error);
    loadGroup();
    window.dispatchEvent(new Event('group-changed'));
  }

  async function leave() {
    const res = await fetch(`/api/groups/${id}/members`, { method: 'DELETE' });
    const d = await res.json();
    if (!d.success) return setError(d.error);
    setMembership(null);
    window.dispatchEvent(new Event('group-changed'));
  }

  async function adminAction(userId: string, action: string, role?: string) {
    const res = await fetch(`/api/groups/${id}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role ? { action, role } : { action }),
    });
    const d = await res.json();
    if (!d.success) return setError(d.error);
    setError('');
    loadGroup();
  }

  async function deleteGroup() {
    if (!confirm('Delete this group permanently?')) return;
    const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!d.success) return setError(d.error);
    window.dispatchEvent(new Event('group-changed'));
    router.push('/groups');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 text-zinc-500">
        <div className="animate-spin w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full mb-3" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error && !group) {
    return <div className="text-center py-16 text-red-400 text-sm">{error}</div>;
  }

  const members = group?.members || [];
  const pending = members.filter((m: any) => m.status === 'pending');

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> Groups
      </Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">{group?.name}</h1>
              {group?.privacy === 'private'
                ? <Lock className="w-4 h-4 text-zinc-500" />
                : <Globe className="w-4 h-4 text-zinc-500" />}
            </div>
            <p className="text-sm text-zinc-400">{group?.description}</p>
            <p className="text-xs text-zinc-500 mt-1">{group?.member_count} members</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {!isActive ? (
            <button onClick={join} className="flex-1 text-sm py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-1">
              <UserPlus className="w-4 h-4" /> {membership?.status === 'pending' ? 'Pending...' : 'Join group'}
            </button>
          ) : (
            <button onClick={leave} className="flex-1 text-sm py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition flex items-center justify-center gap-1">
              <LogOut className="w-4 h-4" /> Leave
            </button>
          )}
          {isAdmin && (
            <button onClick={deleteGroup} className="text-sm py-2 px-3 rounded-xl bg-red-950/50 hover:bg-red-900/50 text-red-400 transition flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {isActive && (
        <div className="flex border-b border-zinc-800 mb-4">
          <button onClick={() => setTab('feed')} className={`flex-1 pb-3 text-sm font-medium transition ${tab === 'feed' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Posts</button>
          <button onClick={() => setTab('members')} className={`flex-1 pb-3 text-sm font-medium transition ${tab === 'members' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Members</button>
          {isAdmin && <button onClick={() => setTab('admin')} className={`flex-1 pb-3 text-sm font-medium transition ${tab === 'admin' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Admin</button>}
        </div>
      )}

      {!isActive ? (
        <div className="text-center text-zinc-600 py-12 text-sm">
          {group?.privacy === 'private' ? 'This is a private group. Join to see posts.' : 'Join this group to see posts.'}
        </div>
      ) : tab === 'feed' ? (
        posts.length === 0 ? (
          <div className="text-center text-zinc-600 py-12 text-sm">No posts in this group yet</div>
        ) : (
          posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onUpdate={() => loadPosts()} />)
        )
      ) : tab === 'members' ? (
        <div className="flex flex-col gap-2">
          {members.map((m: any) => (
            <div key={m.user_id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Link href={`/profile/${m.username}`} className="font-medium text-sm truncate hover:text-white">{m.display_name}</Link>
                {m.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                {m.status === 'pending' && <span className="text-[10px] text-amber-400">pending</span>}
              </div>
              {isAdmin && m.user_id !== currentUserId && (
                <div className="flex items-center gap-1 shrink-0">
                  {m.role !== 'admin' && (
                    <button onClick={() => adminAction(m.user_id, 'role', 'admin')} className="text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition" title="Make admin">
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {m.role === 'admin' && (
                    <button onClick={() => adminAction(m.user_id, 'role', 'user')} className="text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition" title="Demote">
                      Demote
                    </button>
                  )}
                  <button onClick={() => adminAction(m.user_id, 'kick')} className="text-[11px] px-2 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/50 text-red-400 transition" title="Kick">
                    Kick
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold mb-2">Pending requests ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-zinc-600 text-sm py-4">No pending requests</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map((m: any) => (
                <div key={m.user_id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                  <Link href={`/profile/${m.username}`} className="font-medium text-sm truncate">{m.display_name}</Link>
                  <div className="flex gap-2">
                    <button onClick={() => adminAction(m.user_id, 'approve')} className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => adminAction(m.user_id, 'reject')} className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/50 text-red-400 transition">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-2">Members</h2>
            {members.filter((m: any) => m.status === 'active').map((m: any) => (
              <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                <Link href={`/profile/${m.username}`} className="text-sm text-zinc-300 truncate">{m.display_name}</Link>
                <span className="text-xs text-zinc-500">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
