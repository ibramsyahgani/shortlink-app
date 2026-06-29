import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 });
  }

  const workerRes = await fetch(`${WORKER_URL}/api/auth/request-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!workerRes.ok) {
    const err = await workerRes.json() as { error: string };
    return NextResponse.json({ error: err.error }, { status: 500 });
  }

  const { token } = await workerRes.json() as { token: string };
  const magicLink = `${APP_URL}/auth/verify?token=${token}`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: 'Login ke ShortLink App',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;"><h2 style="color:#1a1a1a;margin-bottom:8px;">Masuk ke ShortLink</h2><p style="color:#555;margin-bottom:24px;">Klik tombol di bawah untuk login. Link berlaku selama <strong>15 menit</strong>.</p><a href="${magicLink}" style="display:inline-block;background:#0070f3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:500;font-size:15px;">Masuk sekarang</a><p style="color:#999;font-size:12px;margin-top:24px;">Jika kamu tidak meminta ini, abaikan email ini.</p></div>`,
  });

  return NextResponse.json({ success: true });
}
