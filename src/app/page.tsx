'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TurnstileWidget from '@/components/TurnstileWidget';

export default function Home() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = mode === 'login'
        ? { username, password }
        : { username, display_name: displayName, password };
      body['cf-turnstile-response'] = turnstileToken;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTurnstileToken('');
        setTurnstileResetKey(k => k + 1);
        return;
      }
      router.push('/feed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-1 text-blue-500">TextSpace</h1>
        <p className="text-zinc-500 text-center text-sm mb-8">Text-only social media</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600"
          />
          {mode === 'register' && (
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Display name"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600"
            />
          )}
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {turnstileError && <p className="text-amber-400 text-xs">Bot protection error: {turnstileError}</p>}
          {loading && <p className="text-zinc-500 text-xs text-center">Verifying...</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-xl font-medium"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
          <TurnstileWidget onToken={setTurnstileToken} onError={setTurnstileError} resetKey={turnstileResetKey} />
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setTurnstileToken(''); setTurnstileResetKey(k => k + 1); }}
            className="text-blue-500 hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
