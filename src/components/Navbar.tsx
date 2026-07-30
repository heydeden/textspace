'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar({ username }: { username?: string }) {
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!username) return;
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.role) setRole(d.data.role);
    });
  }, [username]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/feed" className="text-xl font-bold text-blue-500 shrink-0">TS</Link>
        {username && (
          <Link
            href="/feed"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden md:inline">New Post</span>
          </Link>
        )}
        <div className="flex gap-3 items-center text-sm">
          <Link href="/feed" className="text-zinc-400 hover:text-white">Feed</Link>
          {username ? (
            <>
              <Link href={`/profile/${username}`} className="text-zinc-400 hover:text-white">Profile</Link>
              {role === 'admin' && <Link href="/admin" className="text-amber-400 hover:text-amber-300 text-xs font-medium">Admin</Link>}
              <Link href="/settings" className="text-zinc-500 hover:text-white text-xs">⚙</Link>
              <button onClick={async () => {
                await fetch('/api/auth/me', { method: 'DELETE' });
                window.location.href = '/';
              }} className="text-zinc-500 hover:text-red-400 text-xs">Logout</button>
            </>
          ) : (
            <Link href="/" className="text-blue-500">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
