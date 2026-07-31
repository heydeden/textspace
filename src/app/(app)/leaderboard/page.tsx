'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pointsLevel } from '@/lib/points';
import PtsBadge from '@/components/PtsBadge';

interface Entry {
  id: string; username: string; display_name: string; role?: string;
  points: number; post_count: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => {
      if (d.data?.leaderboard) setEntries(d.data.leaderboard);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-bold text-white mb-1">Leaderboard 🏆</h1>
      <p className="text-zinc-500 text-xs mb-4">Top users by points — post, comment, and follow to earn</p>

      {entries.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">No users yet</div>
      ) : (
        <div className="space-y-2">
          {entries.map((u, i) => (
            <Link key={u.id} href={`/profile/${u.username}`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
              <span className="w-8 text-center text-sm font-bold text-zinc-400">{medal(i)}</span>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                {u.display_name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{u.display_name}</span>
                  {u.role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Admin</span>}
                  {u.role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Mod</span>}
                  <PtsBadge pts={u.points} />
                </div>
                <p className="text-zinc-500 text-xs">@{u.username} · {u.post_count} posts</p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-sm">{u.points} pts</div>
                <div className="text-zinc-600 text-[10px]">{pointsLevel(u.points)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
