'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    if (d.data) setResults(d.data.users);
    setLoading(false);
  }

  const roleBadge = (role: string) => {
    if (role === 'admin') return <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Admin</span>;
    if (role === 'mod') return <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Mod</span>;
    return null;
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition" />
      </form>

      {loading ? (
        <div className="text-center text-zinc-500 py-8">Searching...</div>
      ) : searched && results.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No users found</div>
      ) : (
        <div className="space-y-2">
          {results.map(u => (
            <Link key={u.id} href={`/profile/${u.username}`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                {u.display_name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{u.display_name}</span>
                  {roleBadge(u.role)}
                </div>
                <p className="text-zinc-500 text-xs">@{u.username} · {u.points} pts</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
