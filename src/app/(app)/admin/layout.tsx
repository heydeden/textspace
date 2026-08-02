'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, LayoutDashboard, Users, FileText, Award, Sparkles, Flag } from 'lucide-react';

const PAGES = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/posts', label: 'Posts', icon: <FileText className="w-4 h-4" /> },
  { href: '/admin/badges', label: 'Badges', icon: <Award className="w-4 h-4" /> },
  { href: '/admin/name-effects', label: 'Name Effects', icon: <Sparkles className="w-4 h-4" /> },
  { href: '/admin/reports', label: 'Reports', icon: <Flag className="w-4 h-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.role === 'admin') setOk(true);
      else router.replace('/feed');
    });
  }, []);

  if (!ok) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  const current = PAGES.find(p => p.href !== '/admin' ? pathname.startsWith(p.href) : pathname === '/admin') || PAGES[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
        <span className="text-white font-bold shrink-0">Admin</span>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-zinc-300 border border-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition">
            {current.icon}<span>{current.label}</span><ChevronDown className={`w-4 h-4 transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                {PAGES.map(p => (
                  <Link key={p.href} href={p.href} onClick={() => setMenuOpen(false)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition ${pathname === p.href || (p.href !== '/admin' && pathname.startsWith(p.href)) ? 'text-white bg-zinc-800' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                    {p.icon}{p.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
