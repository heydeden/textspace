'use client';
import { useState } from 'react';
import PtsBadge from './PtsBadge';
import VerifiedBadge from './VerifiedBadge';
import ConfirmModal from './ConfirmModal';

interface Comment {
  id: string; content: string; created_at: string;
  parent_id: string | null;
  user_id: string; username: string; display_name: string; role?: string; points?: number; verified?: boolean;
}

function CommentItem({ comment, currentUserId, onReply, onEdit, onDelete, indent }: {
  comment: Comment;
  currentUserId?: string;
  onReply: (parent: Comment, content: string) => void;
  onEdit: (c: Comment, content: string) => void;
  onDelete: (id: string) => void;
  indent: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const isOwn = currentUserId === comment.user_id;

  return (
    <div className={`border-b border-zinc-800 py-2 last:border-0 ${indent ? 'ml-6 border-l border-zinc-800 pl-3' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-medium text-sm text-white">{comment.display_name}</span>
          {comment.verified || comment.role === 'admin' ? <VerifiedBadge /> : null}
          {comment.role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Admin</span>}
          {comment.role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Mod</span>}
          <PtsBadge pts={comment.points} />
        </div>
        <div className="flex items-center gap-2">
          {currentUserId && !isOwn && !indent && (
            <button onClick={() => { setReplying(!replying); setReplyContent(''); }} className="text-zinc-600 hover:text-blue-400 text-xs">Reply</button>
          )}
          {isOwn && !editing && (
            <button onClick={() => setEditing(true)} className="text-zinc-600 hover:text-blue-400 text-xs">Edit</button>
          )}
          {isOwn && (
            <button onClick={() => setConfirmDel(true)} className="text-zinc-600 hover:text-red-400 text-xs">Delete</button>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} maxLength={200} rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none focus:border-blue-500" />
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => { setEditing(false); setEditContent(comment.content); }} className="text-xs text-zinc-500">Cancel</button>
            <button onClick={() => { onEdit(comment, editContent); setEditing(false); }} disabled={!editContent.trim()}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg disabled:opacity-40">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-300">{comment.content}</p>
      )}

      {replying && (
        <div className="flex gap-2 mt-2">
          <input value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder={`Reply to @${comment.username}...`} maxLength={200}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-sm text-white outline-none focus:border-blue-600" />
          <button onClick={() => { onReply(comment, replyContent); setReplying(false); setReplyContent(''); }}
            disabled={!replyContent.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-1.5 rounded-full text-sm">Reply</button>
        </div>
      )}
      <ConfirmModal
        show={confirmDel}
        title="Delete Comment?"
        msg="This permanently deletes this comment and its replies."
        confirmLabel="Delete"
        danger
        onConfirm={() => { setConfirmDel(false); onDelete(comment.id); }}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}

export default function CommentSection({ postId, currentUserId }: { postId: string; currentUserId?: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadComments() {
    if (loaded) return;
    const res = await fetch(`/api/comments?post_id=${postId}`);
    if (res.ok) { const d = await res.json(); setComments(d.data); setLoaded(true); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content }),
      });
      if (res.ok) {
        const d = await res.json();
        setComments(prev => [...prev, d.data]);
        setContent('');
      }
    } finally { setLoading(false); }
  }

  async function handleReply(parent: Comment, replyContent: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content: replyContent, parent_id: parent.id }),
    });
    if (res.ok) {
      const d = await res.json();
      setComments(prev => [...prev, d.data]);
    }
  }

  async function handleEdit(comment: Comment, newContent: string) {
    const res = await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: comment.id, content: newContent }),
    });
    if (res.ok) setComments(prev => prev.map(c => c.id === comment.id ? { ...c, content: newContent } : c));
  }

  async function handleDelete(commentId: string) {
    const res = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId }),
    });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
  }

  const parents = comments.filter(c => !c.parent_id);
  const childrenOf = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div>
      <button onClick={loadComments} className="text-blue-500 text-sm hover:underline mb-3">
        {loaded ? '' : 'Load comments'}
      </button>

      {loaded && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Write a comment..." maxLength={200}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-blue-600" />
          <button type="submit" disabled={loading || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded-full text-sm">
            {loading ? '...' : 'Reply'}
          </button>
        </form>
      )}

      {loaded && parents.map(c => (
        <div key={c.id}>
          <CommentItem comment={c} currentUserId={currentUserId} onReply={handleReply} onEdit={handleEdit} onDelete={handleDelete} indent={false} />
          {childrenOf(c.id).map(child => (
            <CommentItem key={child.id} comment={child} currentUserId={currentUserId} onReply={handleReply} onEdit={handleEdit} onDelete={handleDelete} indent />
          ))}
        </div>
      ))}
    </div>
  );
}
