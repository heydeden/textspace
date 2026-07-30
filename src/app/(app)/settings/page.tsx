'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data) {
        setDisplayName(d.data.display_name || '');
        setBio(d.data.bio || '');
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
        body: JSON.stringify({ display_name: displayName, bio }),
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

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={50}
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
