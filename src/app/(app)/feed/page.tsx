'use client';
import { useState, useEffect, useCallback } from 'react';
import PostCard from '@/components/PostCard';
import PostForm from '@/components/PostForm';

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  async function loadPosts(reset = false) {
    const params = new URLSearchParams({ limit: '20' });
    if (!reset && cursor) params.set('cursor', cursor);
    const res = await fetch(`/api/posts?${params}`);
    if (res.ok) {
      const d = await res.json();
      setPosts(prev => reset ? d.data.posts : [...prev, ...d.data.posts]);
      setCursor(d.data.cursor);
      setHasMore(d.data.has_more);
    }
    setLoading(false);
  }

  useEffect(() => { loadPosts(true); }, []);

  return (
    <div>
      <PostForm onPost={() => loadPosts(true)} />
      {loading ? (
        <div className="text-center text-zinc-500 py-8">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-16">
          <p className="text-xl mb-2">No posts yet</p>
          <p className="text-sm">Be the first to post something!</p>
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
