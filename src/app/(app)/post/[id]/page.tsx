'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostCard from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id);
    });
    async function fetchPost() {
      const res = await fetch(`/api/posts?limit=20`);
      if (res.ok) {
        const d = await res.json();
        const found = d.data.posts.find((p: any) => p.id === id);
        if (found) setPost(found);
        else setError('Post not found');
      }
      setLoading(false);
    }
    fetchPost();
  }, [id]);

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;
  if (error) return <div className="text-center text-zinc-500 py-8">{error}</div>;
  if (!post) return null;

  return (
    <div>
      <PostCard post={post} currentUserId={currentUserId} />
      <div className="border border-zinc-800 rounded-xl p-4 mt-2">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Comments</h3>
        <CommentSection postId={id} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
