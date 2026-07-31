'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, MessageCircle, Link2 } from 'lucide-react';
import PtsBadge from './PtsBadge';
import VerifiedBadge from './VerifiedBadge';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';
import { formatCount } from '@/lib/format';

interface Post {
  id: string; content: string; created_at: string;
  user_id: string; username: string; display_name: string; role?: string; points?: number; verified?: boolean; avatar_style?: string | null; avatar_seed?: string | null;
  like_count: number; comment_count: number; liked_by_me: boolean;
}

function renderContent(content: string) {
  const parts = content.split(/(#[\p{L}\p{N}_]+)/gu);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showDelete, setShowDelete] = useState(false);
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
    if (res.ok) { setEditing(false); setMenuOpen(false); onUpdate?.(); }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch('/api/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id }) });
    if (res.ok) { onDelete?.(post.id); onUpdate?.(); } else { setDeleting(false); setShowDelete(false); }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, reason: reportReason }) });
    setShowReport(false); setReportReason(''); setMenuOpen(false);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setMenuOpen(false);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
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
          <Avatar style={post.avatar_style} seed={post.avatar_seed} username={post.username} displayName={post.display_name} size="sm" />
          <div><span className="font-medium text-sm text-white">{post.display_name}</span>{post.verified || post.role === 'admin' ? <VerifiedBadge /> : null}{post.role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 ml-1 px-1.5 py-0.5 rounded-full">Admin</span>}{post.role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 ml-1 px-1.5 py-0.5 rounded-full">Mod</span>}<PtsBadge pts={post.points} /></div>
        </Link>
        {currentUserId && (
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="text-zinc-600 hover:text-white text-lg leading-none px-2 py-1 rounded hover:bg-zinc-800 transition">⋯</button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                  {isOwn ? (
                    <>
                      {isEditable && !editing && (
                        <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Edit</button>
                      )}
                      <button onClick={() => copyText(post.content)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Copy text</button>
                      <button onClick={() => { setShowDelete(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800">Delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyText(post.content)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Copy text</button>
                      <button onClick={() => { setShowReport(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800">Report</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
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

      <div className="flex items-center gap-5 mt-3 text-zinc-500">
        <button onClick={toggleLike} className="flex items-center gap-1 text-sm hover:text-red-400 transition"><Heart className={`w-4 h-4 ${liked ? 'text-red-500 fill-red-500' : ''}`} /><span>{formatCount(likeCount)}</span></button>
        <Link href={`/post/${post.id}`} className="flex items-center gap-1 text-sm hover:text-blue-400 transition"><MessageCircle className="w-4 h-4" /><span>{formatCount(post.comment_count)}</span></Link>
        {currentUserId && <button onClick={handleShare} className="flex items-center gap-1 text-sm hover:text-green-400 transition"><Link2 className="w-4 h-4" />{copied && <span className="text-[10px] text-green-400">Copied</span>}</button>}
      </div>

      <ConfirmModal
        show={showDelete}
        title="Delete Post?"
        msg="This permanently deletes this post and its likes/comments. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowReport(false)}>
          <form onSubmit={handleReport} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Report Post</h3>
            <p className="text-zinc-500 text-xs mb-4">Help us keep the community safe.</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Why are you reporting this?" maxLength={500} rows={4} autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none focus:border-red-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { setShowReport(false); setReportReason(''); }} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button type="submit" disabled={reportReason.trim().length < 10}
                className="px-5 py-2 rounded-xl text-sm bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-40">Report</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
