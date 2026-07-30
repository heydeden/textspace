'use client';
import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import PostForm from '@/components/PostForm';

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  async function loadPosts(reset = false) {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (!reset && cursor) params.set('cursor', cursor);
      const res = await fetch(`/api/posts?${params}`);
      const d = await res.json();
      if (res.ok) {
        setPosts(prev => reset ? d.data.posts : [...prev, ...d.data.posts]);
        setCursor(d.data.cursor);
        setHasMore(d.data.has_more);
        setError('');
      } else {
        setError(d.error || 'Failed to load posts');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(true); }, []);

  return (
    <div>
      <PostForm onPost={() => loadPosts(true)} />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full mb-3" />
          <span className="text-sm">Loading posts...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm mb-2">{error}</p>
          <button onClick={() => { setLoading(true); loadPosts(true); }} className="text-blue-500 text-sm hover:underline">
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-2xl mb-2">📝</p>
          <p className="text-zinc-400 font-medium">No posts yet</p>
          <p className="text-zinc-600 text-sm mt-1">Type something above and be the first!</p>
        </div>
      ) : (
        <>
          {posts.map(p => <PostCard key={p.id} post={p} onUpdate={() => loadPosts(true)} />)}
          {hasMore && (
            <button
              onClick={() => loadPosts()}
              className="w-full text-blue-500 text-sm py-4 hover:underline"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
