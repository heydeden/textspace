'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard from '@/components/PostCard';

export default function BookmarksPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.data?.id) setCurrentUserId(d.data.id); });
    fetch('/api/bookmarks').then(r => r.json()).then(d => {
      if (d.data) setPosts(d.data.bookmarks);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-bold text-white mb-4">Bookmarks</h1>
      {posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-16 text-sm">No bookmarked posts</div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onUpdate={() => {}} />)
      )}
    </div>
  );
}
