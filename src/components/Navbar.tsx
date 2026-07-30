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
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          <NavItem href="/feed" icon="🏠" label="Feed" />
          <NavItem href="/search" icon="🔍" label="Search" />
          <div className="flex items-center justify-center">
            <Link href="/feed" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold -mt-4 shadow-lg shadow-blue-600/30">
              +
            </Link>
          </div>
          {username ? (
            <>
              <NavItem href={`/profile/${username}`} icon="👤" label="Profile" />
              <button onClick={async () => { await fetch('/api/auth/me', { method: 'DELETE' }); window.location.href = '/'; }}
                className="flex flex-col items-center justify-center text-zinc-500 hover:text-red-400 text-[10px] gap-0.5">
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <NavItem href="/" icon="🔑" label="Login" />
          )}
        </div>
      </nav>

      {/* Desktop top nav */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-black border-b border-zinc-800 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link href="/feed" className="text-xl font-bold text-blue-500">TextSpace</Link>
            <Link href="/feed" className="text-sm text-zinc-400 hover:text-white">Feed</Link>
            {username && <Link href={`/profile/${username}`} className="text-sm text-zinc-400 hover:text-white">Profile</Link>}
            {role === 'admin' && <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">Admin</Link>}
          </div>
          <div className="flex items-center gap-3">
            {username ? (
              <>
                <Link href="/feed" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition">+ Post</Link>
                <Link href="/settings" className="text-zinc-500 hover:text-white text-sm">Settings</Link>
                <button onClick={async () => { await fetch('/api/auth/me', { method: 'DELETE' }); window.location.href = '/'; }}
                  className="text-zinc-500 hover:text-red-400 text-sm">Logout</button>
              </>
            ) : (
              <Link href="/" className="text-blue-500 text-sm">Login</Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center text-zinc-500 hover:text-white text-[10px] gap-0.5 transition">
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
