'use client';
import Link from 'next/link';
import { useState, useEffect, type ReactNode } from 'react';
import { Home, Menu, Lock, User, Search, Bell, MessageCircle, Shield, Settings, LogOut } from 'lucide-react';

export default function Navbar({ username }: { username?: string }) {
  const [role, setRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);

  useEffect(() => {
    if (!username) return;
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.role) setRole(d.data.role);
    });
  }, [username]);

  useEffect(() => {
    if (!username) return;
    const interval = setInterval(() => {
      fetch('/api/notifications?unread=true').then(r => r.json()).then(d => {
        if (d.data?.unread !== undefined) setUnread(d.data.unread);
      });
      fetch('/api/messages').then(r => r.json()).then(d => {
        if (d.data?.unread !== undefined) setMsgUnread(d.data.unread);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [username]);

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'DELETE' });
    window.location.href = '/';
  }

  function openComposer() {
    window.dispatchEvent(new Event('open-composer'));
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-50 md:hidden">
        <div className="grid grid-cols-3 h-16">
          <Link href="/feed" className="flex flex-col items-center justify-center text-zinc-500 hover:text-white text-[10px] gap-0.5 transition">
            <Home className="w-5 h-5" /><span>Feed</span>
          </Link>
          <div className="flex items-center justify-center">
            <button onClick={openComposer} className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold -mt-5 shadow-lg shadow-blue-600/30 active:scale-95 transition">+</button>
          </div>
          {username ? (
            <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center text-zinc-500 hover:text-white text-[10px] gap-0.5 transition relative">
              <Menu className="w-5 h-5" /><span>Menu</span>
              {(unread + msgUnread) > 0 && <span className="absolute -top-0.5 right-1 text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full leading-none">{unread + msgUnread}</span>}
            </button>
          ) : (
            <Link href="/" className="flex flex-col items-center justify-center text-zinc-500 hover:text-white text-[10px] gap-0.5 transition">
              <Lock className="w-5 h-5" /><span>Login</span>
            </Link>
          )}
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="w-full bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-5 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
            <div className="space-y-1">
              <MenuItem icon={<User className="w-5 h-5" />} label="Profile" href={`/profile/${username}`} onClick={() => setMenuOpen(false)} />
              <MenuItem icon={<Search className="w-5 h-5" />} label="Search" href="/search" onClick={() => setMenuOpen(false)} />
              <MenuItem icon={<Bell className="w-5 h-5" />} label={`Notifications${unread > 0 ? ` (${unread})` : ''}`} href="/notifications" onClick={() => setMenuOpen(false)} />
              <MenuItem icon={<MessageCircle className="w-5 h-5" />} label="Messages" href="/messages" onClick={() => setMenuOpen(false)} />
              {role === 'admin' && <MenuItem icon={<Shield className="w-5 h-5" />} label="Admin Panel" href="/admin" onClick={() => setMenuOpen(false)} />}
              <MenuItem icon={<Settings className="w-5 h-5" />} label="Settings" href="/settings" onClick={() => setMenuOpen(false)} />
            </div>
            <div className="border-t border-zinc-800 my-3" />
            <div className="space-y-1"><MenuItem icon={<LogOut className="w-5 h-5" />} label="Logout" onClick={() => { setMenuOpen(false); handleLogout(); }} /></div>
            <button onClick={() => setMenuOpen(false)} className="w-full mt-4 py-3 rounded-xl text-sm text-zinc-400 border border-zinc-800 hover:bg-zinc-800 transition">Cancel</button>
          </div>
        </div>
      )}

      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-black border-b border-zinc-800 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-5">
            <Link href="/feed" className="text-xl font-bold text-blue-500">TextSpace</Link>
            <Link href="/feed" className="text-sm text-zinc-400 hover:text-white">Feed</Link>
            <Link href="/search" className="text-sm text-zinc-400 hover:text-white">Search</Link>
            <Link href="/notifications" className="text-sm text-zinc-400 hover:text-white relative">Notif{unread > 0 && <span className="ml-1 text-red-400">({unread})</span>}</Link>
            {username && <Link href={`/profile/${username}`} className="text-sm text-zinc-400 hover:text-white">Profile</Link>}
            {role === 'admin' && <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">Admin</Link>}
          </div>
          <div className="flex items-center gap-3">
            {username ? (
              <>
                <Link href="/messages" className="text-sm text-zinc-500 hover:text-white">Messages</Link>
                <Link href="/settings" className="text-sm text-zinc-500 hover:text-white">Settings</Link>
                <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-red-400">Logout</button>
                <button onClick={openComposer} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-1.5 rounded-full transition">+ Post</button>
              </>
            ) : (
              <Link href="/" className="text-sm text-blue-500">Login</Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function MenuItem({ icon, label, href, onClick }: { icon: ReactNode; label: string; href?: string; onClick?: () => void }) {
  if (href) {
    return <Link href={href} onClick={onClick} className="flex items-center gap-4 px-3 py-3 rounded-xl text-zinc-300 hover:bg-zinc-800 transition text-sm"><span className="w-7 text-center text-zinc-400">{icon}</span><span>{label}</span></Link>;
  }
  return <button onClick={onClick} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-zinc-300 hover:bg-zinc-800 transition text-sm"><span className="w-7 text-center text-zinc-400">{icon}</span><span>{label}</span></button>;
}
