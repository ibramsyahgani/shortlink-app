// Worker URL dengan fallback hardcode untuk development
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://shortlink-api.ibramsyahgani1.workers.dev';

// Token dummy super_admin — di-set otomatis, tidak perlu login
const DUMMY_TOKEN = 'dummy-super-admin-token-ibramsyah';

if (typeof window !== 'undefined') {
  localStorage.setItem('sl_token', DUMMY_TOKEN);
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sl_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request gagal');
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<{ sessionToken: string; user: User }> {
  const data = await apiFetch<{ sessionToken: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== 'undefined') localStorage.setItem('sl_token', data.sessionToken);
  return data;
}

export function logout() {
  localStorage.setItem('sl_token', DUMMY_TOKEN);
  window.location.href = '/dashboard';
}

export function isLoggedIn(): boolean { return !!getToken(); }

// ── Links ─────────────────────────────────────────────────────
export async function getLinks(page = 1): Promise<LinkRow[]> { return apiFetch(`/api/links?page=${page}`); }
export async function createLink(data: { original_url: string; custom_slug?: string }): Promise<LinkRow> { return apiFetch('/api/links', { method: 'POST', body: JSON.stringify(data) }); }
export async function deleteLink(id: string): Promise<void> { return apiFetch(`/api/links/${id}`, { method: 'DELETE' }); }
export async function getLinkStats(id: string) { return apiFetch(`/api/links/${id}/stats`); }

// ── Users ─────────────────────────────────────────────────────
export async function getUsers(): Promise<UserRow[]> { return apiFetch('/api/users'); }
export async function updateUserRole(userId: string, role: string) { return apiFetch(`/api/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }); }

// ── Logs ─────────────────────────────────────────────────────
export async function getLogs(params?: { page?: number; action?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.action) q.set('action', params.action);
  if (params?.search) q.set('search', params.search);
  return apiFetch<{ logs: LogRow[]; total: number; page: number }>(`/api/logs?${q}`);
}

// ── Me ───────────────────────────────────────────────────────
export async function getMe(): Promise<User> { return apiFetch('/api/me'); }

// ── Types ─────────────────────────────────────────────────────
export type Role = 'user' | 'admin' | 'super_admin';
export interface User { id: string; email: string; name: string | null; role: Role; }
export interface LinkRow { id: string; slug: string; original_url: string; user_email: string; user_role?: Role; click_count: number; created_at: string; }
export interface UserRow { id: string; email: string; name: string | null; role: Role; link_count: number; created_at: string; }
export interface LogRow { id: string; actor_email: string; actor_role: Role; action: string; target_type: string; target_label: string | null; detail: string | null; created_at: string; }
