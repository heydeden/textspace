'use client';
import { useState } from 'react';

export default function PostForm({ onPost }: { onPost: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) { setContent(''); onPost(); }
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-zinc-800 rounded-xl p-4 mb-4">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's happening?"
        maxLength={280}
        rows={3}
        className="w-full bg-transparent resize-none outline-none text-white placeholder-zinc-600"
      />
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${content.length > 260 ? 'text-red-400' : 'text-zinc-600'}`}>
          {content.length}/280
        </span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-1.5 rounded-full text-sm font-medium"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
