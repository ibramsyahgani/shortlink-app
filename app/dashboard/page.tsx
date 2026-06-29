'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { getMe, getLinks, createLink, deleteLink, type User, type LinkRow } from '@/lib/api';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL!;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    getMe().then(setUser).catch(() => { window.location.href = '/login'; });
    fetchLinks();
  }, []);

  async function fetchLinks() {
    const data = await getLinks().catch(() => []);
    setLinks(data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createLink({ original_url: url, custom_slug: slug || undefined });
      setUrl(''); setSlug('');
      await fetchLinks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat link');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus link ini?')) return;
    await deleteLink(id);
    setLinks(l => l.filter(x => x.id !== id));
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${WORKER_URL}/r/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(''), 2000);
  }

  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';
  const totalClicks = links.reduce((a, l) => a + l.click_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[{ label: 'Total link', value: links.length }, { label: 'Total klik', value: totalClicks.toLocaleString('id') }, { label: 'Link aktif', value: links.length }].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Buat short link baru</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://url-panjang-kamu.com/path/yang/panjang" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <div className="flex gap-3">
              <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="text-sm text-gray-400 whitespace-nowrap">/r/</span>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))} placeholder="custom-slug (opsional)" className="flex-1 text-sm outline-none bg-transparent" />
              </div>
              <button type="submit" disabled={loading || !url} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors whitespace-nowrap">
                {loading ? 'Membuat...' : 'Buat link →'}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <p className="text-xs text-gray-400">Kosongkan slug untuk generate otomatis. Slug hanya boleh huruf kecil, angka, - dan _.</p>
          </form>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">{user?.role === 'user' ? 'Link kamu' : 'Semua link'}</h2>
            <span className="text-xs text-gray-400">{links.length} link</span>
          </div>
          {links.length === 0 ? (
            <div className="py-12 text-center text-gray-400"><p className="text-3xl mb-2">🔗</p><p className="text-sm">Belum ada link. Buat yang pertama!</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {links.map(link => (
                <div key={link.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <code className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-mono whitespace-nowrap">/r/{link.slug}</code>
                  <span className="text-sm text-gray-500 flex-1 truncate">{link.original_url}</span>
                  {user?.role !== 'user' && <span className="text-xs text-gray-400 whitespace-nowrap">{link.user_email}</span>}
                  <span className="text-xs text-gray-400 whitespace-nowrap">{link.click_count.toLocaleString('id')} klik</span>
                  <button onClick={() => copyLink(link.slug)} className="text-xs px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500">{copied === link.slug ? '✓ Disalin' : 'Salin'}</button>
                  {canDelete && <button onClick={() => handleDelete(link.id)} className="text-xs px-2.5 py-1 rounded-md border border-red-200 hover:bg-red-50 text-red-500 transition-colors">Hapus</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
