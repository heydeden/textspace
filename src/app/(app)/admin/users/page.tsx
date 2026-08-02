'use client';
import { useState, useEffect } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import VerifiedBadge from '@/components/VerifiedBadge';
import Badge from '@/components/Badge';
import SmartDropdown from '@/components/SmartDropdown';
import { formatCount } from '@/lib/format';
import { NAME_EFFECT_THEMES, NAME_EFFECT_FX, nameEffectClass } from '@/lib/nameEffects';
import { PROFILE_THEMES, themeClasses, themeClassNames } from '@/lib/profileThemes';

type ActionType = 'role' | 'effect' | 'theme' | 'ban' | 'unban' | 'delete';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<{ type: ActionType; userId: string; username: string } | null>(null);
  const [roleInput, setRoleInput] = useState('user');
  const [badgesInput, setBadgesInput] = useState<string[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [allNameEffects, setAllNameEffects] = useState<any[]>([]);
  const [nameEffectIdInput, setNameEffectIdInput] = useState('');
  const [themeInput, setThemeInput] = useState('default');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.id) setCurrentUserId(d.data.id);
    });
    fetch('/api/badges').then(r => r.json()).then(d => {
      if (d.data?.badges) setAllBadges(d.data.badges);
    }).catch(() => {});
    fetch('/api/name-effects').then(r => r.json()).then(d => {
      if (d.data?.nameEffects) setAllNameEffects(d.data.nameEffects);
    }).catch(() => {});
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
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: roleInput, badges: badgesInput }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Role & badges updated'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
  }

  function toggleBadge(id: string) {
    setBadgesInput(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 5) { setMessage('Max 5 badges per user'); return prev; }
      return [...prev, id];
    });
  }

  async function saveNameEffect(userId: string, effectId: string) {
    setMessage('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name_effect_id: effectId || null }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Name effect updated'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
  }

  async function saveProfileTheme(userId: string, theme: string) {
    setMessage('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, theme }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Profile theme updated'); loadUsers(); }
    else setMessage(d.error);
    setAction(null);
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
  }

  const openAction = (type: ActionType, u: any) => {
    if (type === 'role') {
      setRoleInput(u.role || 'user');
      setBadgesInput((u.badges || []).map((b: any) => b.id));
    }
    if (type === 'effect') setNameEffectIdInput(u.name_effect?.id || '');
    if (type === 'theme') setThemeInput(u.theme || 'default');
    setAction({ type, userId: u.id, username: u.username });
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
                      <span title={u.name_effect?.name || u.display_name} className={`text-white font-medium text-sm truncate max-w-40 ${nameEffectClass(u.name_effect?.theme, u.name_effect?.effect)}`}>{u.display_name}</span>
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
                      {(u.badges || []).map((b: any) => <Badge key={b.id} badge={b} />)}
                    </div>
                    <p className="text-zinc-600 text-xs mt-0.5">{formatCount(u.post_count)} posts</p>
                  </div>
                </div>
                <SmartDropdown
                  trigger="⋯"
                  triggerClass="text-zinc-500 hover:text-white text-lg leading-none px-2 py-1 rounded hover:bg-zinc-800 transition"
                  menuClass="w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
                >
                  <button onClick={() => toggleVerify(u.id, !!u.verified)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 ${u.verified ? 'text-zinc-400' : 'text-sky-400'}`}>
                    {u.verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button onClick={() => openAction('role', u)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Edit Role</button>
                  <button onClick={() => openAction('effect', u)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Name Effect</button>
                  <button onClick={() => openAction('theme', u)} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Profile Theme</button>
                  {!isSelf(u.id) && (
                    <button onClick={() => openAction(u.banned ? 'unban' : 'ban', u)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 ${u.banned ? 'text-green-400' : 'text-red-400'}`}>
                      {u.banned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                  {!isSelf(u.id) && (
                    <button onClick={() => openAction('delete', u)} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800">Delete User</button>
                  )}
                </SmartDropdown>
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
            <p className="text-white font-semibold text-sm mt-4 mb-1">Badges</p>
            <p className="text-zinc-500 text-xs mb-2">Max 5 badge per user. Kosongkan = hapus semua.</p>
            {allBadges.length === 0 ? (
              <p className="text-zinc-600 text-xs">Belum ada badge — buat di tab Badges.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {allBadges.map((b: any) => {
                  const checked = badgesInput.includes(b.id);
                  return (
                    <label key={b.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 cursor-pointer transition ${checked ? 'border-blue-600 bg-blue-600/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleBadge(b.id)} className="accent-blue-600" />
                      <Badge badge={b} />
                    </label>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2 flex-wrap min-h-6">
              {badgesInput.map(id => {
                const b = allBadges.find((x: any) => x.id === id);
                return b ? <Badge key={id} badge={b} /> : null;
              })}
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
            <select value={nameEffectIdInput} onChange={e => setNameEffectIdInput(e.target.value)} autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
              <option value="">None</option>
              {allNameEffects.map((ne: any) => <option key={ne.id} value={ne.id}>{ne.name}</option>)}
            </select>
            <p className="text-zinc-600 text-[11px] mt-1">Kelola efek di tab Name Effects (admin).</p>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
              {(() => {
                const ne = allNameEffects.find((x: any) => x.id === nameEffectIdInput);
                const fx = ne ? nameEffectClass(ne.theme, ne.effect) : '';
                return (
                  <span className={`text-lg font-bold ${fx}`}>{action.username}</span>
                );
              })()}
              <p className="text-zinc-600 text-[11px] mt-2">Live preview</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAction(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => saveNameEffect(action.userId, nameEffectIdInput)}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
      {action?.type === 'theme' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setAction(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Profile Theme</h3>
            <p className="text-zinc-500 text-xs mb-4">@{action.username} — tema halaman profil + post card</p>
            <select value={themeInput} onChange={e => setThemeInput(e.target.value)} autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
              {PROFILE_THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className={`h-10 ${themeClasses(themeInput).banner}`} />
              <div className="p-3 flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full bg-zinc-700 shrink-0 ring-2 ${themeClasses(themeInput).ring}`} />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-white truncate block max-w-44">{action.username}</span>
                  <span className="text-[10px] text-zinc-500">Preview profil + post</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAction(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => saveProfileTheme(action.userId, themeInput)}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
