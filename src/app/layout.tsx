import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TextSpace',
  description: 'Text-only social media',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white pb-16 md:pt-16 md:pb-0">
        {children}
      </body>
    </html>
  );
}
