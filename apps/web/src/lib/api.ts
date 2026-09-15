import { getToken, removeToken } from './token';

const API_URL = import.meta.env.VITE_API_URL ?? '';

// Login intentionally returns 401 for a wrong password — that's a normal,
// inline-handled outcome (see Login.tsx), not an expired session, so it
// must not trigger the global redirect below.
const LOGIN_PATH = '/api/auth/login';

function handleUnauthorized(path: string) {
  if (path === LOGIN_PATH) return;
  if (!getToken()) return; // wasn't an authenticated request anyway
  removeToken();
  if (window.location.pathname !== '/admin/login') {
    window.location.href = '/admin/login';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(path);
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error: string }).error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(path);
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error: string }).error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload,
};
