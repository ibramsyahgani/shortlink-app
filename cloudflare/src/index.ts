// Cloudflare Worker — ShortLink API
// GET  /r/:slug              → redirect + catat klik
// POST /api/links            → buat link baru
// GET  /api/links            → list links (role-aware)
// DELETE /api/links/:id      → hapus link (admin/super_admin)
// GET  /api/links/:id/stats  → statistik per link
// GET  /api/users            → list users (admin+)
// PATCH /api/users/:id/role  → ubah role (super_admin only)
// GET  /api/logs             → activity logs (super_admin only)
// POST /api/auth/request-token → kirim magic link
// POST /api/auth/verify-token  → verifikasi token → session

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  WORKER_SECRET: string;
  NEXT_APP_URL: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'super_admin';
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function err(msg: string, status = 400): Response { return json({ error: msg }, status); }

function generateSlug(len = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

async function getSession(req: Request, env: Env): Promise<User | null> {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  const cached = await env.CACHE.get(`session:${token}`);
  if (!cached) return null;
  return JSON.parse(cached) as User;
}

async function requireAuth(req: Request, env: Env): Promise<User | Response> {
  const user = await getSession(req, env);
  if (!user) return err('Unauthorized', 401);
  return user;
}

async function requireRole(req: Request, env: Env, roles: string[]): Promise<User | Response> {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  if (!roles.includes(user.role)) return err('Forbidden', 403);
  return user;
}

async function log(env: Env, actor: User, action: string, target_type: string, target_id: string | null, target_label: string | null, detail?: string) {
  await env.DB.prepare('INSERT INTO activity_logs (actor_id, actor_email, actor_role, action, target_type, target_id, target_label, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(actor.id, actor.email, actor.role, action, target_type, target_id, target_label, detail ?? null).run();
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    if (method === 'GET' && path.startsWith('/r/')) {
      const slug = path.slice(3);
      if (!slug) return err('No slug', 404);
      let original = await env.CACHE.get(`link:${slug}`);
      let linkId: string | null = null;
      if (!original) {
        const row = await env.DB.prepare('SELECT id, original_url FROM links WHERE slug = ?').bind(slug).first<{ id: string; original_url: string }>();
        if (!row) return err('Link not found', 404);
        original = row.original_url;
        linkId = row.id;
        await env.CACHE.put(`link:${slug}`, original, { expirationTtl: 86400 });
      } else {
        const row = await env.DB.prepare('SELECT id FROM links WHERE slug = ?').bind(slug).first<{ id: string }>();
        linkId = row?.id ?? null;
      }
      if (linkId) {
        const ip = req.headers.get('CF-Connecting-IP');
        const ua = req.headers.get('User-Agent');
        const ref = req.headers.get('Referer');
        env.DB.prepare('INSERT INTO clicks (link_id, ip, user_agent, referer) VALUES (?,?,?,?)').bind(linkId, ip, ua, ref).run();
        env.DB.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').bind(linkId).run();
      }
      return Response.redirect(original, 302);
    }

    if (method === 'POST' && path === '/api/auth/request-token') {
      const { email } = await req.json<{ email: string }>();
      if (!email) return err('Email required');
      let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
      if (!user) {
        await env.DB.prepare('INSERT INTO users (email) VALUES (?)').bind(email).run();
        user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
      }
      const token = generateSlug(32);
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await env.DB.prepare('INSERT INTO auth_tokens (email, token, expires_at) VALUES (?,?,?)').bind(email, token, expires).run();
      return json({ token, email, userId: user!.id });
    }

    if (method === 'POST' && path === '/api/auth/verify-token') {
      const { token } = await req.json<{ token: string }>();
      if (!token) return err('Token required');
      const row = await env.DB.prepare('SELECT * FROM auth_tokens WHERE token = ? AND used = 0 AND expires_at > ?').bind(token, new Date().toISOString()).first<{ email: string; id: string }>();
      if (!row) return err('Token invalid or expired', 401);
      await env.DB.prepare('UPDATE auth_tokens SET used = 1 WHERE id = ?').bind(row.id).run();
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(row.email).first<User>();
      if (!user) return err('User not found', 404);
      const sessionToken = generateSlug(48);
      await env.CACHE.put(`session:${sessionToken}`, JSON.stringify(user), { expirationTtl: 7 * 24 * 3600 });
      return json({ sessionToken, user });
    }

    if (method === 'POST' && path === '/api/links') {
      const userOrRes = await requireAuth(req, env);
      if (userOrRes instanceof Response) return userOrRes;
      const actor = userOrRes;
      const { original_url, custom_slug } = await req.json<{ original_url: string; custom_slug?: string }>();
      if (!original_url) return err('URL required');
      let slug = custom_slug?.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '') || '';
      if (slug) {
        const exists = await env.DB.prepare('SELECT id FROM links WHERE slug = ?').bind(slug).first();
        if (exists) return err('Slug sudah digunakan, coba yang lain', 409);
      } else {
        let tries = 0;
        do {
          slug = generateSlug(6);
          const exists = await env.DB.prepare('SELECT id FROM links WHERE slug = ?').bind(slug).first();
          if (!exists) break;
        } while (++tries < 10);
      }
      const result = await env.DB.prepare('INSERT INTO links (slug, original_url, user_id) VALUES (?,?,?) RETURNING *').bind(slug, original_url, actor.id).first<{ id: string; slug: string; original_url: string; created_at: string }>();
      await log(env, actor, 'create_link', 'link', result!.id, slug, original_url);
      await env.CACHE.put(`link:${slug}`, original_url, { expirationTtl: 86400 });
      return json(result, 201);
    }

    if (method === 'GET' && path === '/api/links') {
      const userOrRes = await requireAuth(req, env);
      if (userOrRes instanceof Response) return userOrRes;
      const actor = userOrRes;
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = 20;
      const offset = (page - 1) * limit;
      let rows;
      if (actor.role === 'user') {
        rows = await env.DB.prepare('SELECT l.*, u.email as user_email FROM links l JOIN users u ON u.id = l.user_id WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT ? OFFSET ?').bind(actor.id, limit, offset).all();
      } else {
        rows = await env.DB.prepare('SELECT l.*, u.email as user_email, u.role as user_role FROM links l JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
      }
      return json(rows.results);
    }

    if (method === 'DELETE' && path.startsWith('/api/links/')) {
      const userOrRes = await requireRole(req, env, ['admin', 'super_admin']);
      if (userOrRes instanceof Response) return userOrRes;
      const actor = userOrRes;
      const linkId = path.split('/')[3];
      const link = await env.DB.prepare('SELECT * FROM links WHERE id = ?').bind(linkId).first<{ id: string; slug: string; original_url: string; user_id: string }>();
      if (!link) return err('Link not found', 404);
      await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(linkId).run();
      await env.CACHE.delete(`link:${link.slug}`);
      await log(env, actor, 'delete_link', 'link', link.id, link.slug, `URL: ${link.original_url}`);
      return json({ success: true });
    }

    if (method === 'GET' && path.match(/^\/api\/links\/[^/]+\/stats$/)) {
      const userOrRes = await requireAuth(req, env);
      if (userOrRes instanceof Response) return userOrRes;
      const actor = userOrRes;
      const linkId = path.split('/')[3];
      const link = await env.DB.prepare('SELECT * FROM links WHERE id = ?').bind(linkId).first<{ user_id: string; click_count: number; slug: string }>();
      if (!link) return err('Link not found', 404);
      if (actor.role === 'user' && link.user_id !== actor.id) return err('Forbidden', 403);
      const dailyClicks = await env.DB.prepare('SELECT date(clicked_at) as date, COUNT(*) as count FROM clicks WHERE link_id = ? GROUP BY date(clicked_at) ORDER BY date DESC LIMIT 30').bind(linkId).all();
      return json({ link, daily_clicks: dailyClicks.results });
    }

    if (method === 'GET' && path === '/api/users') {
      const userOrRes = await requireRole(req, env, ['admin', 'super_admin']);
      if (userOrRes instanceof Response) return userOrRes;
      const users = await env.DB.prepare('SELECT id, email, name, role, created_at, (SELECT COUNT(*) FROM links WHERE user_id = users.id) as link_count FROM users ORDER BY created_at DESC').all();
      return json(users.results);
    }

    if (method === 'PATCH' && path.match(/^\/api\/users\/[^/]+\/role$/)) {
      const userOrRes = await requireRole(req, env, ['super_admin']);
      if (userOrRes instanceof Response) return userOrRes;
      const actor = userOrRes;
      const targetId = path.split('/')[3];
      if (targetId === actor.id) return err('Tidak bisa mengubah role sendiri');
      const { role } = await req.json<{ role: string }>();
      if (!['user', 'admin', 'super_admin'].includes(role)) return err('Role tidak valid');
      const target = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(targetId).first<User>();
      if (!target) return err('User not found', 404);
      const oldRole = target.role;
      await env.DB.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').bind(role, new Date().toISOString(), targetId).run();
      const action = role > oldRole ? 'role_upgrade' : 'role_downgrade';
      await log(env, actor, action, 'user', targetId, target.email, `${oldRole} → ${role}`);
      return json({ success: true, old_role: oldRole, new_role: role });
    }

    if (method === 'GET' && path === '/api/logs') {
      const userOrRes = await requireRole(req, env, ['super_admin']);
      if (userOrRes instanceof Response) return userOrRes;
      const page = parseInt(url.searchParams.get('page') || '1');
      const action = url.searchParams.get('action') || '';
      const search = url.searchParams.get('search') || '';
      const limit = 20;
      const offset = (page - 1) * limit;
      const query = `SELECT * FROM activity_logs WHERE 1=1 ${action ? "AND action = '" + action.replace(/'/g, '') + "'" : ''} ${search ? "AND (actor_email LIKE '%" + search.replace(/'/g, '') + "%' OR target_label LIKE '%" + search.replace(/'/g, '') + "%')" : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const logs = await env.DB.prepare(query).bind(limit, offset).all();
      const total = await env.DB.prepare('SELECT COUNT(*) as count FROM activity_logs').first<{ count: number }>();
      return json({ logs: logs.results, total: total?.count ?? 0, page, limit });
    }

    if (method === 'GET' && path === '/api/me') {
      const user = await getSession(req, env);
      if (!user) return err('Unauthorized', 401);
      return json(user);
    }

    return err('Not found', 404);
  },
};
