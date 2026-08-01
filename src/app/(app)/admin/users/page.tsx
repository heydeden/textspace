'use client';
import { useState, useEffect } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import VerifiedBadge from '@/components/VerifiedBadge';
import CustomRoleBadge from '@/components/CustomRoleBadge';
import { formatCount } from '@/lib/format';
import { NAME_EFFECTS, nameEffectClass } from '@/lib/nameEffects';

type ActionType = 'points' | 'role' | 'effect' | 'ban' | 'unban' | 'delete';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [action, setAction] = useState<{ type: ActionType; userId: string; username: string } | null>(null);
  const [pointsInput, setPointsInput] = useState('');
  const [roleInput, setRoleInput] = useState('user');
  const [customRolesInput, setCustomRolesInput] = useState('');
  const [effectInput, setEffectInput] = useState('none');
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

  async function saveRole(userId: string) {
    const custom_roles = customRolesInput.split(',').map(s => s.trim()).filter(Boolean);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: roleInput, custom_roles }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Role & custom roles updated'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
    setMenuFor(null);
  }

  async function saveNameEffect(userId: string, effect: string) {
    setMessage('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name_effect: effect }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Name effect updated'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
    setMenuFor(null);
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
    setAction(null);
    setMenuFor(null);
  }

  async function setPoints(userId: string, value: string) {
    setMessage('');
    const pts = Number(value);
    if (value.trim() === '' || !Number.isInteger(pts) || pts < 0 || pts > 1000000) { setMessage('Points must be integer 0-1000000'); return; }
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, points: pts }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Points updated'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
    setMenuFor(null);
  }

  async function toggleVerify(userId: string, currentVerified: boolean) {
    setMessage('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, verified: !currentVerified }),
    });
    const d = await res.json();
    if (d.success) { setMessage(currentVerified ? 'Unverified' : 'Verified'); loadUsers(); }
    else setMessage(d.error);
    setMenuFor(null);
  }

  async function confirmDelete() {
    if (!action) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: action.userId }),
    });
    const d = await res.json();
    if (d.success) { setMessage('User deleted'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
    setMenuFor(null);
  }

  const openAction = (type: ActionType, u: any) => {
    if (type === 'points') setPointsInput(String(u.points));
    if (type === 'role') {
      setRoleInput(u.role || 'user');
      setCustomRolesInput((u.custom_roles || []).join(', '));
    }
    if (type === 'effect') setEffectInput(u.name_effect || 'none');
    setAction({ type, userId: u.id, username: u.username });
    setMenuFor(null);
  };

  const isSelf = (id: string) => id === currentUserId;
  const target = action ? users.find(u => u.id === action.userId) : null;

  return (
    <div>
      <ConfirmModal
        show={action?.type === 'delete'}
        title="Delete User?"
        msg={`This permanently deletes @${action?.username} and ALL their posts, comments, and likes. This cannot be undone.`}
        confirmLabel="Delete Forever"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setAction(null)}
      />
      <ConfirmModal
        show={action?.type === 'ban' || action?.type === 'unban'}
        title={action?.type === 'ban' ? 'Ban User?' : 'Unban User?'}
        msg={action?.type === 'ban'
          ? `@${action?.username} will immediately lose API access (suspended) and their posts will be hidden.`
          : `@${action?.username} will regain full access.`}
        confirmLabel={action?.type === 'ban' ? 'Ban' : 'Unban'}
        danger={action?.type === 'ban'}
        onConfirm={() => action && toggleBan(action.userId, action.type === 'ban' ? false : true)}
        onCancel={() => setAction(null)}
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span title={u.display_name} className={`text-white font-medium text-sm truncate max-w-40 ${nameEffectClass(u.name_effect) ? `effect-name ${nameEffectClass(u.name_effect)}` : ''}`}>{u.display_name}</span>
                      <span className="text-zinc-500 text-xs shrink-0">@{u.username}</span>
                      {isSelf(u.id) && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full shrink-0">You</span>}
                      {(u.verified || u.role === 'admin') && <VerifiedBadge />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {u.role !== 'user' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {u.role}
                        </span>
                      )}
                      {u.banned && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Banned</span>}
                      {(u.custom_roles || []).map((r: string) => <CustomRoleBadge key={r} name={r} />)}
                    </div>
                    <p className="text-zinc-600 text-xs mt-0.5">{formatCount(u.post_count)} posts · {u.points} pts</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}
                    className="text-zinc-500 hover:text-white text-lg leading-none px-2 py-1 rounded hover:bg-zinc-800 transition">⋯</button>
                  {menuFor === u.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                      <div className="absolute right-0 top-full z-40 mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                        <button onClick={() => toggleVerify(u.id, !!u.verified)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 ${u.verified ? 'text-zinc-400' : 'text-sky-400'}`}>
                          {u.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button onClick={() => openAction('points', u)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Edit Points</button>
                        <button onClick={() => openAction('role', u)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Edit Role</button>
                        <button onClick={() => openAction('effect', u)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Name Effect</button>
                        {!isSelf(u.id) && (
                          <button onClick={() => openAction(u.banned ? 'unban' : 'ban', u)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 ${u.banned ? 'text-green-400' : 'text-red-400'}`}>
                            {u.banned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                        {!isSelf(u.id) && (
                          <button onClick={() => openAction('delete', u)} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800">Delete User</button>
                        )}
                      </div>
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

      {action?.type === 'points' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setAction(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Edit Points</h3>
            <p className="text-zinc-500 text-xs mb-4">@{action.username}</p>
            <input type="number" min={0} max={1000000} value={pointsInput} onChange={e => setPointsInput(e.target.value)} autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAction(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => setPoints(action.userId, pointsInput)}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}

      {action?.type === 'role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setAction(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Edit Role</h3>
            <p className="text-zinc-500 text-xs mb-4">@{action.username}</p>
            <p className="text-zinc-400 text-xs mb-1 font-medium">Role</p>
            <select value={roleInput} onChange={e => setRoleInput(e.target.value)} autoFocus disabled={isSelf(action.userId)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none disabled:opacity-40 disabled:cursor-not-allowed">
              <option value="user">User</option>
              <option value="mod">Mod</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf(action.userId) && <p className="text-zinc-600 text-xs mt-1">Role kamu terkunci (admin).</p>}
            <p className="text-white font-semibold text-sm mt-4 mb-1">Custom Roles</p>
            <p className="text-zinc-500 text-xs mb-2">Max 5, 1-24 chars each, pisah pakai koma. Kosongkan = hapus semua.</p>
            <input value={customRolesInput} onChange={e => setCustomRolesInput(e.target.value)}
              placeholder="Veteran, Artist, OG"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            <div className="flex items-center gap-1 mt-2 flex-wrap min-h-6">
              {customRolesInput.split(',').map(s => s.trim()).filter(Boolean).map((r: string) => <CustomRoleBadge key={r} name={r} />)}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAction(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => saveRole(action.userId)}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
      {action?.type === 'effect' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setAction(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Name Effect</h3>
            <p className="text-zinc-500 text-xs mb-4">@{action.username} — efek tampilan nama display</p>
            <select value={effectInput} onChange={e => setEffectInput(e.target.value)} autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
              {NAME_EFFECTS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
              <span className={`text-lg font-bold ${effectInput === 'none' ? 'text-white' : `effect-name ${nameEffectClass(effectInput)}`}`}>
                {action.username}
              </span>
              <p className="text-zinc-600 text-[11px] mt-2">Live preview</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAction(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => saveNameEffect(action.userId, effectInput)}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
