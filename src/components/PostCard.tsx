'use client';
import Link from 'next/link';
import { useState } from 'react';
import PtsBadge from './PtsBadge';

interface Post {
  id: string; content: string; created_at: string;
  user_id: string; username: string; display_name: string; role?: string; points?: number;
  like_count: number; comment_count: number; liked_by_me: boolean;
}

function renderContent(content: string) {
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#') && part.length > 1) {
      return <Link key={i} href={`/search?q=${encodeURIComponent(part)}`} className="text-blue-400 hover:underline">{part}</Link>;
    }
    return part;
  });
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: { post: Post; currentUserId?: string; onUpdate?: () => void; onDelete?: (id: string) => void }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const isOwn = currentUserId && post.user_id === currentUserId;
  const isEditable = isOwn && (Date.now() - new Date(post.created_at).getTime()) / 3600000 <= 24;

  async function toggleLike() {
    const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id }) });
    if (res.ok) { const d = (await res.json()).data; setLiked(d.liked); setLikeCount(c => d.liked ? c + 1 : c - 1); onUpdate?.(); }
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) return;
    setEditSaving(true);
    const res = await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, content: editContent }),
    });
    setEditSaving(false);
    if (res.ok) { setEditing(false); onUpdate?.(); }
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

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="border border-zinc-800 rounded-xl p-4 mb-3 hover:border-zinc-700 transition">
      <div className="flex items-center justify-between mb-1">
        <Link href={`/profile/${post.username}`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{post.display_name[0]?.toUpperCase()}</div>
          <div><span className="font-medium text-sm text-white">{post.display_name}</span><span className="text-zinc-500 text-xs ml-2">@{post.username}</span>{post.role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 ml-1 px-1.5 py-0.5 rounded-full">Admin</span>}{post.role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 ml-1 px-1.5 py-0.5 rounded-full">Mod</span>}<PtsBadge pts={post.points} /></div>
        </Link>
        {isOwn ? (
          <div className="flex items-center gap-1">
            {isEditable && !editing && <button onClick={() => setEditing(true)} className="text-zinc-600 hover:text-blue-400 text-xs px-2 py-1 rounded">Edit</button>}
            <button onClick={handleDelete} disabled={deleting} className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded">{deleting ? '...' : 'Delete'}</button>
          </div>
        ) : currentUserId && (
          <button onClick={() => setShowReport(!showReport)} className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded">🚩</button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} maxLength={280} rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none focus:border-blue-500" />
          <div className="flex justify-end gap-2 mt-2">
            <span className={`text-xs self-center mr-auto ${editContent.length > 260 ? 'text-red-400' : 'text-zinc-500'}`}>{editContent.length}/280</span>
            <button onClick={() => { setEditing(false); setEditContent(post.content); }} className="text-xs text-zinc-500">Cancel</button>
            <button onClick={handleSaveEdit} disabled={editSaving || !editContent.trim()}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg disabled:opacity-40">{editSaving ? '...' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <Link href={`/post/${post.id}`} className="block"><p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p></Link>
      )}

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
        {currentUserId && <button onClick={handleShare} className="flex items-center gap-1 text-sm hover:text-green-400 transition"><span>🔗</span>{copied && <span className="text-[10px] text-green-400">Copied</span>}</button>}
      </div>
    </div>
  );
}
