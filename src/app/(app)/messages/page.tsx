'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PtsBadge from '@/components/PtsBadge';
import VerifiedBadge from '@/components/VerifiedBadge';
import Avatar from '@/components/Avatar';

export default function MessagesPage() {
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/messages').then(r => r.json()).then(d => {
      if (d.data) setConvos(d.data.conversations);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-bold text-white mb-4">Messages</h1>
      {convos.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">
          <p>No conversations yet</p>
          <p className="text-xs mt-2 text-zinc-700">Go to someone's profile to send a message</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convos.map(c => (
            <Link key={c.user_id} href={`/messages/${c.user_id}`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
              <Avatar style={c.avatar_style} username={c.username} displayName={c.display_name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-medium text-sm">{c.display_name}</p>
                  {c.verified || c.role === 'admin' ? <VerifiedBadge /> : null}
                  {c.role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Admin</span>}
                  {c.role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Mod</span>}
                  <PtsBadge pts={c.points} />
                </div>
                <p className="text-zinc-500 text-xs truncate">{c.last_message}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
