'use client';
import Link from 'next/link';
import { useState } from 'react';

interface Post {
  id: string; content: string; created_at: string;
  user_id: string; username: string; display_name: string;
  like_count: number; comment_count: number; liked_by_me: boolean;
}

export default function PostCard({ post, onUpdate }: { post: Post; onUpdate?: () => void }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);

  async function toggleLike() {
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.data.liked);
      setLikeCount(c => data.data.liked ? c + 1 : c - 1);
      onUpdate?.();
    }
  }

  return (
    <div className="border border-zinc-800 rounded-xl p-4 mb-3 hover:border-zinc-700 transition">
      <Link href={`/profile/${post.username}`} className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
          {post.display_name[0]?.toUpperCase()}
        </div>
        <div>
          <span className="font-medium text-sm text-white">{post.display_name}</span>
          <span className="text-zinc-500 text-xs ml-2">@{post.username}</span>
        </div>
      </Link>

      <Link href={`/post/${post.id}`} className="block">
        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </Link>

      <div className="flex items-center gap-6 mt-3 text-zinc-500">
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm hover:text-red-400 transition">
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount}</span>
        </button>
        <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 text-sm hover:text-blue-400 transition">
          <span>💬</span>
          <span>{post.comment_count}</span>
        </Link>
      </div>
    </div>
  );
}
