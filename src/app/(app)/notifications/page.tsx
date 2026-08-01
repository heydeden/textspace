'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import Avatar from '@/components/Avatar';

const POLL_MS = 8000;

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const d = await res.json();
      if (d.data) setNotifs(d.data.notifications);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-bold text-white mb-4">Notifications</h1>
      {notifs.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">No notifications yet</div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} className={`bg-zinc-900 border ${n.read ? 'border-zinc-800' : 'border-blue-800'} rounded-xl p-4`}>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar style={n.avatar_style} seed={n.avatar_seed} username={n.username} displayName={n.display_name} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <Link href={`/profile/${n.username}`} title={n.display_name} className="text-white font-medium hover:underline truncate max-w-40">{n.display_name}</Link>
                    {n.verified || n.role === 'admin' ? <VerifiedBadge /> : null}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {n.type === 'like' && <>liked your <Link href={`/post/${n.post_id}`} className="text-blue-400 hover:underline">post</Link></>}
                    {n.type === 'comment' && <>commented on your <Link href={`/post/${n.post_id}`} className="text-blue-400 hover:underline">post</Link></>}
                    {n.type === 'follow' && <>followed you</>}
                    {!['like', 'comment', 'follow'].includes(n.type) && <>interacted with you</>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
