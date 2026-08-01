'use client';
import { useState, useEffect } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { NAME_EFFECT_THEMES, NAME_EFFECT_FX, nameEffectClass } from '@/lib/nameEffects';

export default function AdminNameEffects() {
  const [effects, setEffects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDelete, setShowDelete] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  const [nameInput, setNameInput] = useState('');
  const [themeInput, setThemeInput] = useState('violet');
  const [fxInput, setFxInput] = useState('none');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  async function loadEffects() {
    const res = await fetch('/api/admin/name-effects');
    const d = await res.json();
    if (d.data) setEffects(d.data.nameEffects);
    setLoading(false);
  }

  useEffect(() => { loadEffects(); }, []);

  async function createEffect() {
    setMessage('');
    const res = await fetch('/api/admin/name-effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput, theme: themeInput, effect: fxInput }),
    });
    const d = await res.json();
    if (d.success) { setMessage(`Efek "${nameInput}" dibuat`); setNameInput(''); loadEffects(); }
    else setMessage(d.error);
  }

  async function updateEffect(id: string, patch: any) {
    setMessage('');
    const res = await fetch('/api/admin/name-effects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effect_id: id, ...patch }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Efek diupdate'); loadEffects(); }
    else setMessage(d.error);
    setEditing(null);
  }

  async function deleteEffect() {
    if (!showDelete) return;
    setMessage('');
    const res = await fetch('/api/admin/name-effects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effect_id: showDelete.id }),
    });
    const d = await res.json();
    if (d.success) { setMessage('Efek dihapus'); loadEffects(); }
    else setMessage(d.error);
    setShowDelete(null);
  }

  const previewCls = nameEffectClass(themeInput, fxInput);

  return (
    <div>
      <ConfirmModal
        show={!!showDelete}
        title="Delete Name Effect?"
        msg={`"${showDelete?.name}" akan dihapus — user yang memakainya kembali ke nama normal. Tidak bisa dibatalkan.`}
        confirmLabel="Delete Forever"
        danger
        onConfirm={deleteEffect}
        onCancel={() => setShowDelete(null)}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold mb-3">Buat Name Effect Baru</h3>
        <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={24}
          placeholder="Nama efek (1-24 chars)"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-zinc-400 text-xs mb-1 font-medium">Tema (warna)</p>
            <select value={themeInput} onChange={e => setThemeInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {NAME_EFFECT_THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-zinc-400 text-xs mb-1 font-medium">Efek (animasi)</p>
            <select value={fxInput} onChange={e => setFxInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {NAME_EFFECT_FX.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
          <span className={`text-lg font-bold ${previewCls}`}>{nameInput.trim() || 'Preview Nama'}</span>
          <p className="text-zinc-600 text-[11px] mt-2">Live preview nama</p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={createEffect} disabled={!nameInput.trim()}
            className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-40">Buat Efek</button>
        </div>
      </div>

      {message && <p className="text-sm text-green-400 mb-3">{message}</p>}

      {loading ? (
        <div className="text-center text-zinc-500 py-8">Loading...</div>
      ) : effects.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">Belum ada name effect</div>
      ) : (
        <div className="space-y-2">
          {effects.map(e => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-sm font-bold ${nameEffectClass(e.theme, e.effect)}`}>{e.name}</span>
                <span className="text-zinc-500 text-xs shrink-0">{e.grant_count} user</span>
                {!e.active && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">nonaktif</span>}
              </div>
              <div className="relative shrink-0">
                <button onClick={() => setMenuFor(menuFor === e.id ? null : e.id)}
                  className="text-zinc-500 hover:text-white text-lg leading-none px-2 py-1 rounded hover:bg-zinc-800 transition">⋯</button>
                {menuFor === e.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                    <div className="absolute right-0 top-full z-40 mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                      <button onClick={() => { updateEffect(e.id, { active: !e.active }); setMenuFor(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">
                        {e.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button onClick={() => { setEditing(e); setMenuFor(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Edit</button>
                      <button onClick={() => { setShowDelete(e); setMenuFor(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800">Hapus</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Edit Name Effect</h3>
            <p className="text-zinc-500 text-xs mb-4">{editing.name}</p>
            <input value={editing.name} maxLength={24} onChange={e => setEditing({ ...editing, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-zinc-400 text-xs mb-1 font-medium">Tema</p>
                <select value={editing.theme} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  {NAME_EFFECT_THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-zinc-400 text-xs mb-1 font-medium">Efek</p>
                <select value={editing.effect} onChange={e => setEditing({ ...editing, effect: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  {NAME_EFFECT_FX.map(fx => <option key={fx.key} value={fx.key}>{fx.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
              <span className={`text-lg font-bold ${nameEffectClass(editing.theme, editing.effect)}`}>{editing.name}</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
              <button onClick={() => updateEffect(editing.id, { name: editing.name, theme: editing.theme, effect: editing.effect })}
                className="px-5 py-2 rounded-xl text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
