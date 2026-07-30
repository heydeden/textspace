'use client';
import { useState } from 'react';

export default function PostForm({ onPost }: { onPost: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (res.ok) { setContent(''); onPost(); }
      else { setError(d.error || 'Failed to post'); }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
          U
        </div>
        <span className="text-sm font-medium text-zinc-400">Create Post</span>
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's happening?"
        maxLength={280}
        rows={3}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 resize-none outline-none text-white placeholder-zinc-400 focus:border-blue-600 transition"
      />
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs ${content.length > 260 ? 'text-red-400' : 'text-zinc-500'}`}>
            {content.length}/280
          </span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full text-sm font-semibold transition"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
