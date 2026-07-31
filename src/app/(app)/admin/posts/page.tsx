'use client';
import { useState, useEffect } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { formatCount } from '@/lib/format';

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function loadPosts() {
    const res = await fetch(`/api/admin/posts?page=${page}&limit=20`);
    const d = await res.json();
    if (d.data) {
      setPosts(d.data.posts);
      setTotalPages(d.data.pages);
    }
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, [page]);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function deletePost(postId: string) {
    await fetch('/api/admin/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    });
    setDeleteTarget(null);
    loadPosts();
  }

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      {posts.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No posts</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{p.display_name}</span>
                    <span className="text-zinc-500 text-xs">@{p.username}</span>
                  </div>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap break-words">{p.content}</p>
                  <p className="text-zinc-600 text-xs mt-1 inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {formatCount(p.like_count)} <MessageCircle className="w-3 h-3 ml-2" /> {formatCount(p.comment_count)}</p>
                </div>
                <button
                  onClick={() => setDeleteTarget(p.id)}
                  className="shrink-0 text-zinc-600 hover:text-red-400 text-xs px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-zinc-500 disabled:opacity-30 text-sm">Prev</button>
              <span className="text-zinc-600 text-sm">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-zinc-500 disabled:opacity-30 text-sm">Next</button>
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Post?"
        msg="This permanently deletes this post and its likes/comments. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => deletePost(deleteTarget!)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
