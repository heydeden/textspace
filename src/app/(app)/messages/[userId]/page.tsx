'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  async function load() {
    const me = await fetch('/api/auth/me').then(r => r.json());
    if (me.data?.id) setCurrentUserId(me.data.id);
    const res = await fetch(`/api/messages/${userId}`);
    const d = await res.json();
    if (d.data) { setMessages(d.data.messages); setOther(d.data.other); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: userId, content }),
    });
    if (res.ok) { setContent(''); load(); }
  }

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <Link href={`/profile/${other?.username}`} className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{other?.display_name?.[0]?.toUpperCase()}</div>
        <span className="text-white font-medium text-sm">{other?.display_name}</span>
        <span className="text-zinc-500 text-xs">@{other?.username}</span>
      </Link>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && <div className="text-center text-zinc-600 py-8 text-sm">No messages yet. Say hello!</div>}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message..." maxLength={500}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
        <button type="submit" disabled={!content.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-3 rounded-full text-sm font-medium">Send</button>
      </form>
    </div>
  );
}
