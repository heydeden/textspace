'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PostComposer() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(false);

  // Jika URL ada di halaman grup → post masuk ke grup itu.
  const groupId = usePathname().match(/^\/groups\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/)?.[1];

  useEffect(() => {
    const openHandler = () => { setError(''); setOpen(true); };
    window.addEventListener('open-composer', openHandler);
    return () => window.removeEventListener('open-composer', openHandler);
  }, []);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...(groupId ? { group_id: groupId } : {}) }),
      });
      const d = await res.json();
      if (res.ok) {
        setContent('');
        setOpen(false);
        window.dispatchEvent(new Event('post-created'));
        showToast();
      } else {
        setError(d.error || 'Failed to post');
      }
    } catch {
      setError('Failed to connect. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => !loading && setOpen(false)}>
          <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-3">Create Post</h3>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening?"
              maxLength={280}
              rows={4}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 resize-none outline-none text-white placeholder-zinc-500 focus:border-blue-500 transition"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${content.length > 260 ? 'text-red-400' : 'text-zinc-500'}`}>{content.length}/280</span>
                {error && <span className="text-xs text-red-400">{error}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setOpen(false)} disabled={loading}
                  className="px-4 py-2 rounded-full text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition disabled:opacity-40">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !content.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full text-sm font-semibold transition">
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg animate-slide-up">
          Post created ✓
        </div>
      )}
    </>
  );
}
