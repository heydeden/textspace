'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserIdentity from '@/components/UserIdentity';
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
              <Avatar style={c.avatar_style} seed={c.avatar_seed} username={c.username} displayName={c.display_name} size="md" />
              <div className="min-w-0 flex-1">
                <UserIdentity displayName={c.display_name} verified={c.verified} role={c.role} pts={c.points} size="md" />
                <p className="text-zinc-500 text-xs truncate">{c.last_message}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
