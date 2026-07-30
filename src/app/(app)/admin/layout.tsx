'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data?.role === 'admin') setOk(true);
      else router.replace('/feed');
    });
  }, []);

  if (!ok) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-4 text-sm overflow-x-auto">
        <span className="text-white font-bold shrink-0">Admin</span>
        <Link href="/admin" className="text-zinc-500 hover:text-white shrink-0">Dashboard</Link>
        <Link href="/admin/users" className="text-zinc-500 hover:text-white shrink-0">Users</Link>
        <Link href="/admin/posts" className="text-zinc-500 hover:text-white shrink-0">Posts</Link>
        <Link href="/admin/reports" className="text-zinc-500 hover:text-white shrink-0">Reports</Link>
      </div>
      {children}
    </div>
  );
}
