'use client';
import { useState, useEffect } from 'react';
import Badge from '@/components/Badge';
import ConfirmModal from '@/components/ConfirmModal';
import { BADGE_THEMES, BADGE_EFFECTS, badgeThemeClass, badgeEffectClass } from '@/lib/badges';

export default function AdminBadges() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDelete, setShowDelete] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  const [nameInput, setNameInput] = useState('');
  const [themeInput, setThemeInput] = useState('violet');
  const [effectInput, setEffectInput] = useState('none');

  async function loadBadges() {
    const res = await fetch('/api/admin/badges');
    const d = await res.json();
    if (d.data) setBadges(d.data.badges);
    setLoading(false);
  }

  useEffect(() => { loadBadges(); }, []);

  async function createBadge() {
    setMessage('');
    const res = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput, theme: themeInput, effect: effectInput }),
    });
    const d = await res.json();
    if (d.success) { setMessage(`Badge "${nameInput}" dibuat`); setNameInput(''); loadBadges(); }
    else setMessage(d.error);
  }

  async function updateBadge(id: string, patch: any) {
    setMessage('');
    const res = await fetch('/api/admin/badges', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badge_id: id, ...patch }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Badge diupdate'); loadBadges(); }
    else setMessage(d.error);
    setEditing(null);
  }

  async function deleteBadge() {
    if (!showDelete) return;
    setMessage('');
    const res = await fetch('/api/admin/badges', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badge_id: showDelete.id }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Badge dihapus'); loadBadges(); }
    else setMessage(d.error);
    setShowDelete(null);
  }

  const previewCls = `${badgeThemeClass(themeInput)} ${badgeEffectClass(effectInput)}`;

  return (
    <div>
      <ConfirmModal
        show={!!showDelete}
        title="Delete Badge?"
        msg={`"${showDelete?.name}" akan dihapus dari SEMUA user yang memilikinya. Tidak bisa dibatalkan.`}
        confirmLabel="Delete Forever"
        danger
        onConfirm={deleteBadge}
        onCancel={() => setShowDelete(null)}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold mb-3">Buat Badge Baru</h3>
        <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={24}
          placeholder="Nama badge (1-24 chars)"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-zinc-400 text-xs mb-1 font-medium">Tema</p>
            <select value={themeInput} onChange={e => setThemeInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {BADGE_THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-zinc-400 text-xs mb-1 font-medium">Efek</p>
            <select value={effectInput} onChange={e => setEffectInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {BADGE_EFFECTS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${previewCls}`}>{nameInput.trim() || 'Preview Badge'}</span>
          <span className="text-zinc-600 text-[11px]">Live preview</span>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={createBadge} disabled={!nameInput.trim()}
            className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-40">Buat Badge</button>
        </div>
      </div>

      {message && <p className="text-sm text-green-400 mb-3">{message}</p>}

      {loading ? (
        <div className="text-center text-zinc-500 py-8">Loading...</div>
      ) : badges.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">Belum ada badge</div>
      ) : (
        <div className="space-y-2">
          {badges.map(b => (
            <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Badge badge={b} />
                <span className="text-zinc-500 text-xs shrink-0">{b.grant_count} user</span>
                {!b.active && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">nonaktif</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateBadge(b.id, { active: !b.active })}
                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition">
                  {b.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => setEditing(b)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition">Edit</button>
                <button onClick={() => setShowDelete(b)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-900 text-red-400 hover:bg-red-950/50 transition">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Edit Badge</h3>
            <p className="text-zinc-500 text-xs mb-4">{editing.name}</p>
            <input value={editing.name} maxLength={24} onChange={e => setEditing({ ...editing, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-zinc-400 text-xs mb-1 font-medium">Tema</p>
                <select value={editing.theme} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  {BADGE_THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-zinc-400 text-xs mb-1 font-medium">Efek</p>
                <select value={editing.effect} onChange={e => setEditing({ ...editing, effect: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  {BADGE_EFFECTS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <Badge badge={editing} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => updateBadge(editing.id, { name: editing.name, theme: editing.theme, effect: editing.effect })}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
