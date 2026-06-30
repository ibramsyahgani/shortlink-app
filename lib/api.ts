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

// ── SOP ──────────────────────────────────────────────────────
export interface SopFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  r2_key: string;
  uploaded_at: string;
}

export interface SopRowApi {
  id: string;
  kategori: string;
  pic: string;
  product: string;
  topik: string;
  sub_topik: string;
  sop_dokumen: string;
  files: SopFile[];
  created_at: string;
  updated_at: string;
}

export async function getSopRows(kategori?: string): Promise<SopRowApi[]> {
  const q = kategori ? `?kategori=${encodeURIComponent(kategori)}` : '';
  return apiFetch(`/api/sop${q}`);
}

export async function createSopRow(data: Partial<{ kategori: string; pic: string; product: string; topik: string; subTopik: string; sopDokumen: string }>): Promise<SopRowApi> {
  return apiFetch('/api/sop', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSopRow(id: string, data: Partial<{ kategori: string; pic: string; product: string; topik: string; subTopik: string; sopDokumen: string }>): Promise<void> {
  return apiFetch(`/api/sop/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteSopRow(id: string): Promise<void> {
  return apiFetch(`/api/sop/${id}`, { method: 'DELETE' });
}

export async function uploadSopFile(rowId: string, file: File): Promise<SopFile> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sl_token') : null;
  const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://shortlink-api.ibramsyahgani1.workers.dev';
  const res = await fetch(`${WORKER_URL}/api/sop/${rowId}/files`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      'Content-Length': String(file.size),
      'X-File-Name': file.name,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Upload gagal');
  return data as SopFile;
}

export async function deleteSopFile(fileId: string): Promise<void> {
  return apiFetch(`/api/sop/files/${fileId}`, { method: 'DELETE' });
}

export function getSopFileUrl(fileId: string): string {
  const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://shortlink-api.ibramsyahgani1.workers.dev';
  return `${WORKER_URL}/api/sop/files/${fileId}`;
}

// ── Types ─────────────────────────────────────────────────────
export type Role = 'user' | 'admin' | 'super_admin';
export interface User { id: string; email: string; name: string | null; role: Role; }
export interface LinkRow { id: string; slug: string; original_url: string; user_email: string; user_role?: Role; click_count: number; created_at: string; }
export interface UserRow { id: string; email: string; name: string | null; role: Role; link_count: number; created_at: string; }
export interface LogRow { id: string; actor_email: string; actor_role: Role; action: string; target_type: string; target_label: string | null; detail: string | null; created_at: string; }
