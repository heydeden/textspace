'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dices } from 'lucide-react';
import { AVATAR_CATEGORIES, avatarUrl, variantSeed } from '@/lib/avatars';

const VARIANTS = 4;

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarStyle, setAvatarStyle] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data) {
        setDisplayName(d.data.display_name || '');
        setBio(d.data.bio || '');
        setAvatarStyle(d.data.avatar_style || null);
        setAvatarSeed(d.data.avatar_seed || null);
        setUsername(d.data.username || '');
        setLoading(false);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, bio, avatar_style: avatarStyle, avatar_seed: avatarSeed }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage('Saved!');
        setTimeout(() => router.push(`/profile/${d.data.username}`), 1000);
      } else {
        setMessage(d.error || 'Failed');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  const selected = (s: string, seed: string) => avatarStyle === s && avatarSeed === seed;
  const currentSeed = avatarSeed || username;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Avatar</label>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={avatarStyle ? avatarUrl(avatarStyle, currentSeed) : avatarUrl('adventurer-neutral', currentSeed)}
              alt="Avatar preview"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover bg-zinc-800"
            />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{avatarStyle || 'adventurer-neutral'}</p>
              <p className="text-zinc-500 text-xs">Klik 4 varian per style — pilih yang paling cocok</p>
            </div>
            <button
              type="button"
              onClick={() => { setAvatarStyle(avatarStyle || 'adventurer-neutral'); setAvatarSeed(randomSeed()); }}
              title="Acak"
              className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition px-3 py-2 border border-zinc-700 rounded-xl"
            >
              <Dices className="w-5 h-5" />
              <span className="text-[10px]">Acak</span>
            </button>
          </div>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {AVATAR_CATEGORIES.map(cat => (
              <div key={cat.name}>
                <p className="text-zinc-400 text-xs font-semibold mb-2">{cat.name} ({cat.styles.length} style)</p>
                <div className="grid grid-cols-6 gap-2">
                  {cat.styles.map(s => (
                    <div key={s} className="space-y-1.5">
                      {Array.from({ length: VARIANTS }).map((_, v) => {
                        const seed = variantSeed(username, v);
                        const active = selected(s, seed);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => { setAvatarStyle(s); setAvatarSeed(seed); }}
                            title={`${s} varian ${v + 1}`}
                            className={`w-full rounded-full overflow-hidden transition ${active ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}
                          >
                            <img src={avatarUrl(s, seed)} alt={`${s} ${v + 1}`} width={64} height={64} loading="lazy" className="w-full aspect-square object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={16}
            className="w-full bg-neutral-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full bg-neutral-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition resize-none"
          />
        </div>
        {message && (
          <p className={`text-sm ${message === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-xl font-medium transition"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
