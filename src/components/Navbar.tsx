'use client';
import Link from 'next/link';

export default function Navbar({ username }: { username?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-xl mx-auto flex items-center justify-around md:justify-between px-4 h-14">
        <Link href="/feed" className="text-xl font-bold text-blue-500">TextSpace</Link>
        <div className="flex gap-4 items-center text-sm">
          <Link href="/feed" className="text-zinc-400 hover:text-white">Feed</Link>
          {username ? (
            <>
              <Link href={`/profile/${username}`} className="text-zinc-400 hover:text-white">Profile</Link>
              <button onClick={async () => {
                await fetch('/api/auth/me', { method: 'DELETE' });
                window.location.href = '/';
              }} className="text-zinc-500 hover:text-red-400">Logout</button>
            </>
          ) : (
            <Link href="/" className="text-blue-500">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
