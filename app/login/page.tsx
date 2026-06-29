'use client';
import { useState } from 'react';
import { requestMagicLink } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🔗</span>
            <span className="text-2xl font-semibold">ShortLink</span>
          </div>
          <p className="text-gray-500 text-sm">Masuk dengan email kamu</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <h3 className="font-medium text-gray-900 mb-1">Cek email kamu!</h3>
              <p className="text-sm text-gray-500">
                Link masuk sudah dikirim ke <strong>{email}</strong>. Berlaku selama 15 menit.
              </p>
              <button onClick={() => { setSent(false); setEmail(''); }} className="mt-4 text-sm text-blue-600 hover:underline">
                Kirim ulang dengan email lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kamu@example.com" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading || !email} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
                {loading ? 'Mengirim...' : 'Kirim link masuk →'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Belum punya akun? Daftar otomatis saat masuk pertama kali.</p>
      </div>
    </div>
  );
}
