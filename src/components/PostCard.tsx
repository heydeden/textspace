'use client';
import Link from 'next/link';
import { useState } from 'react';

interface Post {
  id: string; content: string; created_at: string;
  user_id: string; username: string; display_name: string; role?: string;
  like_count: number; comment_count: number; liked_by_me: boolean;
  bookmarked_by_me?: boolean;
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: { post: Post; currentUserId?: string; onUpdate?: () => void; onDelete?: (id: string) => void }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(!!post.bookmarked_by_me);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isOwn = currentUserId && post.user_id === currentUserId;

  async function toggleLike() {
    const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id }) });
    if (res.ok) { const d = (await res.json()).data; setLiked(d.liked); setLikeCount(c => d.liked ? c + 1 : c - 1); onUpdate?.(); }
  }

  async function toggleRepost() {
    const res = await fetch('/api/reposts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id }) });
    if (res.ok) { setReposted((await res.json()).data.reposted); onUpdate?.(); }
  }

  async function toggleBookmark() {
    const res = await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id }) });
    if (res.ok) setBookmarked((await res.json()).data.bookmarked);
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    const res = await fetch('/api/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id }) });
    if (res.ok) { onDelete?.(post.id); onUpdate?.(); } else setDeleting(false);
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, reason: reportReason }) });
    setShowReport(false); setReportReason('');
  }

  return (
    <div className="border border-zinc-800 rounded-xl p-4 mb-3 hover:border-zinc-700 transition">
      <div className="flex items-center justify-between mb-1">
        <Link href={`/profile/${post.username}`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{post.display_name[0]?.toUpperCase()}</div>
          <div><span className="font-medium text-sm text-white">{post.display_name}</span><span className="text-zinc-500 text-xs ml-2">@{post.username}</span>{post.role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 ml-1 px-1.5 py-0.5 rounded-full">Admin</span>}{post.role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 ml-1 px-1.5 py-0.5 rounded-full">Mod</span>}</div>
        </Link>
        {isOwn ? (
          <button onClick={handleDelete} disabled={deleting} className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded">{deleting ? '...' : 'Delete'}</button>
        ) : currentUserId && (
          <button onClick={() => setShowReport(!showReport)} className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded">🚩</button>
        )}
      </div>

      <Link href={`/post/${post.id}`} className="block"><p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p></Link>

      {showReport && currentUserId && (
        <form onSubmit={handleReport} className="mt-2 bg-zinc-800/50 rounded-lg p-3">
          <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Why are you reporting this?" maxLength={500} rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none focus:border-red-500" />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => { setShowReport(false); setReportReason(''); }} className="text-xs text-zinc-500">Cancel</button>
            <button type="submit" disabled={reportReason.length < 10} className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg disabled:opacity-40">Report</button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-5 mt-3 text-zinc-500">
        <button onClick={toggleLike} className="flex items-center gap-1 text-sm hover:text-red-400 transition"><span>{liked ? '❤️' : '🤍'}</span><span>{likeCount}</span></button>
        <Link href={`/post/${post.id}`} className="flex items-center gap-1 text-sm hover:text-blue-400 transition"><span>💬</span><span>{post.comment_count}</span></Link>
        {currentUserId && <button onClick={toggleRepost} className={`flex items-center gap-1 text-sm transition ${reposted ? 'text-green-400' : 'hover:text-green-400'}`}><span>🔁</span></button>}
        {currentUserId && <button onClick={toggleBookmark} className={`flex items-center gap-1 text-sm transition ${bookmarked ? 'text-red-500' : 'hover:text-red-500'}`}><span>{bookmarked ? '🔖' : '🔖'}</span></button>}
      </div>
    </div>
  );
}
