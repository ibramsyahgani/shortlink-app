'use client';
import { useEffect, useState } from 'react';
import { getMe, logout, type User } from '@/lib/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROLE_BADGE: Record<string, { label: string; class: string }> = {
  super_admin: { label: '⭐ Super Admin', class: 'bg-purple-100 text-purple-700' },
  admin: { label: '🛡️ Admin', class: 'bg-blue-100 text-blue-700' },
  user: { label: '👤 User', class: 'bg-gray-100 text-gray-600' },
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    getMe().then(setUser).catch(() => { if (typeof window !== 'undefined') window.location.href = '/login'; });
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(user?.role === 'admin' || user?.role === 'super_admin' ? [{ href: '/admin/users', label: 'Kelola User' }] : []),
    ...(user?.role === 'super_admin' ? [{ href: '/admin/logs', label: 'Log Aktivitas' }] : []),
  ];

  const badge = user ? ROLE_BADGE[user.role] : null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900"><span>🔗</span><span>ShortLink</span></Link>
          <div className="flex gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === l.href ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>{l.label}</Link>
            ))}
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            {badge && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.class}`}>{badge.label}</span>}
            <span className="text-sm text-gray-500">{user.email}</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Keluar</button>
          </div>
        )}
      </div>
    </nav>
  );
}
