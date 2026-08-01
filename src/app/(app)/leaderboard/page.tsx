'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal } from 'lucide-react';
import { pointsLevel } from '@/lib/points';
import UserIdentity from '@/components/UserIdentity';
import Avatar from '@/components/Avatar';
import { formatCount } from '@/lib/format';

interface Entry {
  id: string; username: string; display_name: string; role?: string; verified?: boolean; avatar_style?: string | null; avatar_seed?: string | null;
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

  const medal = (i: number) => i === 0 ? <Medal className="w-4 h-4 text-yellow-400 fill-yellow-400 inline" /> : i === 1 ? <Medal className="w-4 h-4 text-zinc-300 fill-zinc-300 inline" /> : i === 2 ? <Medal className="w-4 h-4 text-amber-700 fill-amber-700 inline" /> : <span className="text-sm font-bold text-zinc-500">{i + 1}.</span>;

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-bold text-white mb-1 inline-flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />Leaderboard</h1>
      <p className="text-zinc-500 text-xs mb-4">Top users by points — post, comment, and follow to earn</p>

      {entries.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">No users yet</div>
      ) : (
        <div className="space-y-2">
          {entries.map((u, i) => (
            <Link key={u.id} href={`/profile/${u.username}`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
              <span className="w-8 text-center text-sm font-bold text-zinc-400">{medal(i)}</span>
              <Avatar style={u.avatar_style} seed={u.avatar_seed} username={u.username} displayName={u.display_name} size="md" />
              <div className="min-w-0 flex-1">
                <UserIdentity displayName={u.display_name} verified={u.verified} role={u.role} pts={u.points} size="md" />
                <p className="text-zinc-500 text-xs">{formatCount(u.post_count)} posts</p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-sm">{formatCount(u.points)} pts</div>
                <div className="text-zinc-600 text-[10px]">{pointsLevel(u.points)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
