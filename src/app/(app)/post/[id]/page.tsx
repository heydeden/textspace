'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const loadPost = useCallback(async () => {
    const res = await fetch(`/api/posts?id=${id}`);
    if (res.ok) {
      const d = await res.json();
      const found = d.data.posts.find((p: any) => p.id === id);
      if (found) { setPost(found); setError(''); }
      else setError('Post not found');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id);
    });
    loadPost();
  }, [loadPost]);

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;
  if (error) return <div className="text-center text-zinc-500 py-8">{error}</div>;
  if (!post) return null;

  return (
    <div>
      <PostCard post={post} currentUserId={currentUserId} onUpdate={() => loadPost()} onDelete={() => router.push('/feed')} />
      <div className="border border-zinc-800 rounded-xl p-4 mt-2">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Comments</h3>
        <CommentSection postId={id} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
