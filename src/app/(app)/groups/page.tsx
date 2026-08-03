'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Lock, Search, Plus } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '', privacy: 'public' });
  const router = useRouter();

  async function loadGroups() {
    const res = await fetch(`/api/groups${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    const d = await res.json();
    if (d.data) setGroups(d.data.groups);
    setLoading(false);
  }

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    const handler = () => loadGroups();
    window.addEventListener('group-changed', handler);
    return () => window.removeEventListener('group-changed', handler);
  }, []);

  async function createGroup() {
    setError('');
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!d.success) return setError(d.error || 'Failed to create group');
    setShowCreate(false);
    setForm({ name: '', slug: '', description: '', privacy: 'public' });
    loadGroups();
    window.dispatchEvent(new Event('group-changed'));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Groups</h1>
        <button onClick={() => setShowCreate(v => !v)} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Group name"
            maxLength={40}
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-1 ring-blue-500"
          />
          <input
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="Slug (e.g. anime-lovers)"
            maxLength={40}
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-1 ring-blue-500"
          />
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            maxLength={300}
            rows={2}
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-1 ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {['public', 'private'].map(p => (
                <button key={p} onClick={() => setForm({ ...form, privacy: p })}
                  className={`text-xs px-3 py-1 rounded-full capitalize ${form.privacy === p ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  {p === 'public' ? 'Public' : 'Private'}
                </button>
              ))}
            </div>
            <button onClick={createGroup} className="text-sm px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition">Create</button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); loadGroups(); }}
          placeholder="Search groups..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 text-zinc-500">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full mb-3" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">No groups found</div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(g => (
            <Link key={g.id} href={`/groups/${g.id}`} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{g.name}</span>
                    {g.privacy === 'private' && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
                    {g.is_member && <span className="text-[10px] text-blue-400">member</span>}
                    {g.is_pending && <span className="text-[10px] text-amber-400">pending</span>}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{g.description}</p>
                </div>
                <div className="text-right text-xs text-zinc-500 shrink-0">
                  <div>{g.member_count} members</div>
                  <div>{g.post_count} posts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
