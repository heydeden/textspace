'use client';
import { useState } from 'react';

interface Comment {
  id: string; content: string; created_at: string;
  parent_id: string | null;
  user_id: string; username: string; display_name: string;
}

export default function CommentSection({ postId, currentUserId }: { postId: string; currentUserId?: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadComments() {
    if (loaded) return;
    const res = await fetch(`/api/comments?post_id=${postId}`);
    if (res.ok) { const d = await res.json(); setComments(d.data); setLoaded(true); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content }),
      });
      if (res.ok) {
        const d = await res.json();
        setComments(prev => [...prev, { ...d.data, user_id: currentUserId || '', username: '', display_name: '' }]);
        setContent('');
      }
    } finally { setLoading(false); }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId }),
    });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
  }

  return (
    <div>
      <button onClick={loadComments} className="text-blue-500 text-sm hover:underline mb-3">
        {loaded ? '' : 'Load comments'}
      </button>

      {loaded && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Write a comment..." maxLength={200}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-blue-600" />
          <button type="submit" disabled={loading || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded-full text-sm">
            {loading ? '...' : 'Reply'}
          </button>
        </form>
      )}

      {loaded && comments.map(c => (
        <div key={c.id} className="border-b border-zinc-800 py-2 last:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-medium text-sm text-white">{c.display_name}</span>
              <span className="text-zinc-500 text-xs">@{c.username}</span>
            </div>
            {currentUserId === c.user_id && (
              <button onClick={() => handleDelete(c.id)} className="text-zinc-600 hover:text-red-400 text-xs">Delete</button>
            )}
          </div>
          <p className="text-sm text-zinc-300">{c.content}</p>
        </div>
      ))}
    </div>
  );
}
