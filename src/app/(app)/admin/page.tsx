'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      if (d.data) setStats(d.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading stats...</div>;
  if (!stats) return <div className="text-center text-red-400 py-8">Failed to load</div>;

  const cards = [
    { label: 'Total Users', value: stats.total_users, color: 'border-blue-500' },
    { label: 'Total Posts', value: stats.total_posts, color: 'border-green-500' },
    { label: 'Total Comments', value: stats.total_comments, color: 'border-purple-500' },
    { label: 'Users Today', value: stats.today_users, color: 'border-amber-500' },
    { label: 'Posts Today', value: stats.today_posts, color: 'border-pink-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`bg-zinc-900 border-l-4 ${c.color} rounded-xl p-4`}>
          <p className="text-zinc-500 text-xs mb-1">{c.label}</p>
          <p className="text-2xl font-bold text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
