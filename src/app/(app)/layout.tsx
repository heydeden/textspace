import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/');
  return (
    <>
      <Navbar username={user.username} />
      <main className="max-w-xl mx-auto px-4 py-4">
        {children}
      </main>
    </>
  );
}
