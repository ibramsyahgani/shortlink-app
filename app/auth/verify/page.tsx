'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyMagicLink } from '@/lib/api';

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Token tidak ditemukan di URL.'); return; }
    verifyMagicLink(token)
      .then(() => { setStatus('success'); setTimeout(() => router.push('/dashboard'), 1500); })
      .catch(err => { setStatus('error'); setMessage(err.message || 'Token tidak valid atau sudah kedaluwarsa.'); });
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (<><div className="text-4xl mb-3 animate-pulse">🔄</div><p className="text-gray-600">Memverifikasi token...</p></>)}
        {status === 'success' && (<><div className="text-4xl mb-3">✅</div><p className="font-medium text-gray-900">Login berhasil!</p><p className="text-sm text-gray-500 mt-1">Mengalihkan ke dashboard...</p></>)}
        {status === 'error' && (<><div className="text-4xl mb-3">❌</div><p className="font-medium text-red-700">{message}</p><a href="/login" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Kembali ke halaman login</a></>)}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
