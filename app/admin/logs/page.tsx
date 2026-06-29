'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { getMe, getLogs, type LogRow } from '@/lib/api';

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  create_link: { label: 'Buat link', color: 'bg-green-100 text-green-700', icon: '+' },
  delete_link: { label: 'Hapus link', color: 'bg-red-100 text-red-700', icon: '✕' },
  role_upgrade: { label: 'Naik role', color: 'bg-purple-100 text-purple-700', icon: '↑' },
  role_downgrade: { label: 'Turun role', color: 'bg-amber-100 text-amber-700', icon: '↓' },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMe().then(u => { if (u.role !== 'super_admin') { window.location.href = '/dashboard'; } }).catch(() => { window.location.href = '/login'; });
  }, []);

  useEffect(() => {
    setLoading(true);
    getLogs({ page, action: action || undefined, search: search || undefined })
      .then(d => { setLogs(d.logs); setTotal(d.total); }).finally(() => setLoading(false));
  }, [page, action, search]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-purple-50 flex items-center justify-between flex-wrap gap-3">
            <div><h1 className="font-semibold text-purple-900">Log aktivitas sistem</h1><p className="text-xs text-purple-500 mt-0.5">{total.toLocaleString('id')} total entri</p></div>
            <div className="flex gap-2">
              <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="text-sm px-3 py-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="">Semua aksi</option>
                {Object.entries(ACTION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input type="text" placeholder="Cari email / slug..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="text-sm px-3 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 w-44" />
            </div>
          </div>
          {loading ? <div className="py-12 text-center text-gray-400 text-sm">Memuat...</div> : logs.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">Tidak ada log ditemukan.</div> : (
            <div className="divide-y divide-gray-100">
              {logs.map(log => {
                const meta = ACTION_META[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-500', icon: '•' };
                return (
                  <div key={log.id} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                    <span className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap mt-0.5 ${meta.color}`}>{meta.icon} {meta.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700"><span className="font-medium">{log.actor_email}</span>{' '}
                        {log.action === 'create_link' && <>membuat <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/r/{log.target_label}</code></>}
                        {log.action === 'delete_link' && <>menghapus <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/r/{log.target_label}</code></>}
                        {(log.action === 'role_upgrade' || log.action === 'role_downgrade') && <>mengubah role <span className="font-medium">{log.target_label}</span> ({log.detail})</>}
                      </p>
                      {log.detail && log.action.includes('link') && <p className="text-xs text-gray-400 truncate mt-0.5">{log.detail}</p>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
              <span>Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs">← Sebelumnya</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs">Berikutnya →</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
