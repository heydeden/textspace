'use client';
import { useState, useEffect } from 'react';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/reports');
    const d = await res.json();
    if (d.data) setReports(d.data.reports);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: string) {
    await fetch('/api/admin/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report_id: id }) });
    load();
  }

  async function deleteReport(id: string) {
    await fetch('/api/admin/reports', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report_id: id }) });
    load();
  }

  if (loading) return <div className="text-center text-zinc-500 py-8">Loading...</div>;

  return (
    <div>
      <h2 className="text-white font-semibold mb-4">Reports</h2>
      {reports.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">No reports</div>
      ) : (
        <div className="space-y-2">
          {reports.map(r => (
            <div key={r.id} className={`bg-zinc-900 border ${r.resolved ? 'border-green-900/50' : 'border-red-900/50'} rounded-xl p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-zinc-300">
                  <p><span className="text-zinc-500">By:</span> {r.reporter_username}</p>
                  <p className="text-xs text-zinc-500 mt-1">{r.reason}</p>
                  {r.post_content && <p className="text-xs text-zinc-600 mt-2">Post: "{r.post_content.slice(0, 100)}"</p>}
                  {r.post_author_username && <p className="text-xs text-zinc-600">by @{r.post_author_username}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!r.resolved && <button onClick={() => resolve(r.id)} className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded">Resolve</button>}
                  <button onClick={() => deleteReport(r.id)} className="text-xs text-zinc-600 hover:text-red-400 px-2 py-1">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
