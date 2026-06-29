'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { getMe, getUsers, updateUserRole, type User, type UserRow } from '@/lib/api';

const ROLE_OPTIONS = [
  { value: 'user', label: '👤 User' },
  { value: 'admin', label: '🛡️ Admin' },
  { value: 'super_admin', label: '⭐ Super Admin' },
];

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-500',
};

export default function AdminUsersPage() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMe().then(u => { if (u.role === 'user') { window.location.href = '/dashboard'; return; } setMe(u); return getUsers(); })
      .then(u => u && setUsers(u)).catch(() => { window.location.href = '/login'; });
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return;
    setLoading(true);
    try {
      await updateUserRole(userId, newRole);
      setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole as UserRow['role'] } : x));
    } finally { setLoading(false); }
  }

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div><h1 className="font-semibold text-gray-900">Kelola user</h1><p className="text-xs text-gray-400 mt-0.5">{users.length} total user</p></div>
            <input type="text" placeholder="Cari email..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map(user => {
              const isSelf = user.id === me?.id;
              const canChangeRole = me?.role === 'super_admin' && !isSelf;
              return (
                <div key={user.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-500'}`}>{user.email.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{user.email}{isSelf && <span className="ml-2 text-xs text-gray-400">(kamu)</span>}</p><p className="text-xs text-gray-400">{user.link_count} link dibuat</p></div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>{ROLE_OPTIONS.find(r => r.value === user.role)?.label}</span>
                  {canChangeRole ? (
                    <select value={user.role} disabled={loading} onChange={e => handleRoleChange(user.id, e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  ) : <div className="w-28" />}
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
