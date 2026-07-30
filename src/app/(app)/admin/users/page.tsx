'use client';
import { useState, useEffect } from 'react';

function ConfirmModal({ show, title, msg, confirmLabel, danger, onConfirm, onCancel }: {
  show: boolean; title: string; msg: string; confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{msg}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
          <button onClick={onConfirm} className={`px-5 py-2 rounded-xl text-sm text-white font-medium transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<{ userId: string; username: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id);
    });
  }, []);

  async function loadUsers() {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('q', search);
    const res = await fetch(`/api/admin/users?${params}`);
    const d = await res.json();
    if (d.data) { setUsers(d.data.users); setTotalPages(d.data.pages); }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, [page]);

  async function changeRole(userId: string, role: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    });
    const d = await res.json();
    if (d.success) loadUsers();
    else setMessage(d.error);
  }

  async function toggleBan(userId: string, currentBanned: boolean) {
    setMessage('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, banned: !currentBanned }),
    });
    const d = await res.json();
    if (d.success) { setMessage(currentBanned ? 'Unbanned' : 'Banned'); loadUsers(); }
    else setMessage(d.error);
  }

  async function confirmDelete() {
    if (!modal) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: modal.userId }),
    });
    const d = await res.json();
    if (d.success) { setMessage('User deleted'); loadUsers(); }
    else setMessage(d.error);
    setModal(null);
  }

  const isSelf = (id: string) => id === currentUserId;

  return (
    <div>
      <ConfirmModal
        show={!!modal}
        title="Delete User?"
        msg={`This permanently deletes @${modal?.username} and ALL their posts, comments, and likes. This cannot be undone.`}
        confirmLabel="Delete Forever"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setModal(null)}
      />

      <div className="flex items-center gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
        <button onClick={() => { setPage(1); loadUsers(); }} className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm">Search</button>
      </div>

      {message && <p className="text-sm text-green-400 mb-3">{message}</p>}

      {loading ? (
        <div className="text-center text-zinc-500 py-8">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No users found</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className={`bg-zinc-900 border ${u.banned ? 'border-red-900/50' : isSelf(u.id) ? 'border-blue-900/50' : 'border-zinc-800'} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{u.display_name}</span>
                    <span className="text-zinc-500 text-xs">@{u.username}</span>
                    {isSelf(u.id) && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">You</span>}
                    {u.role !== 'user' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role}
                      </span>
                    )}
                    {u.banned && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Banned</span>}
                  </div>
                  <p className="text-zinc-600 text-xs mt-0.5">{u.post_count} posts · {u.points} pts</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isSelf(u.id) && (
                    <>
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded text-xs text-white px-2 py-1 outline-none">
                        <option value="user">User</option>
                        <option value="mod">Mod</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => toggleBan(u.id, u.banned)}
                        className={`text-xs px-3 py-1 rounded transition ${u.banned ? 'bg-green-800 text-green-200 hover:bg-green-700' : 'bg-red-900/50 text-red-300 hover:bg-red-800'}`}>
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                      <button onClick={() => setModal({ userId: u.id, username: u.username })}
                        className="text-xs text-zinc-600 hover:text-red-400 px-2 py-1">Del</button>
                    </>
                  )}
                </div>
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
    </div>
  );
}
