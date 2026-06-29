# ShortLink App

Aplikasi pemendek URL dengan autentikasi magic link, analitik klik, dan sistem role.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, TypeScript
- **Backend:** Cloudflare Worker
- **Database:** Cloudflare D1 (SQLite)
- **Cache/Session:** Cloudflare KV
- **Email:** Resend (magic link)
- **Deploy Frontend:** Vercel

## Struktur

```
shortlink-app/
├── app/                    # Next.js frontend
│   ├── login/
│   ├── auth/verify/
│   ├── dashboard/
│   ├── admin/users/
│   ├── admin/logs/
│   └── api/auth/send-magic-link/
├── cloudflare/
│   ├── src/index.ts
│   ├── wrangler.toml
│   └── migrations/
├── components/Navbar.tsx
└── lib/api.ts
```

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/ibramsyahgani/shortlink-app.git
cd shortlink-app
npm install
```

### 2. Environment Variables

Salin `.env.example` ke `.env.local` dan isi:

```env
NEXT_PUBLIC_WORKER_URL=https://shortlink-api.YOUR_SUBDOMAIN.workers.dev
RESEND_API_KEY=re_xxxx
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://shortlink-app.vercel.app
```

### 3. Deploy Cloudflare Worker

```bash
cd cloudflare
npx wrangler deploy
npx wrangler secret put WORKER_SECRET
npx wrangler d1 migrations apply shortlink-db --remote
```

### 4. Deploy ke Vercel

Hubungkan repo ini ke Vercel dan set environment variables di dashboard Vercel.
