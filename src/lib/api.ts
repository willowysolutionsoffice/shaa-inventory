const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown>;
};

async function serverCookieHeader(): Promise<Record<string, string>> {
  try {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const raw = store.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    return raw ? { Cookie: raw } : {};
  } catch {
    return {};
  }
}

// ── Refresh guard (client-side only — server uses short-lived RSC calls) ──────
let _refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (_refreshing) return _refreshing;
  _refreshing = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

// ── Core request (internal, no retry) ────────────────────────────────────────
async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const isServer = typeof window === 'undefined';
  const extraHeaders = isServer ? await serverCookieHeader() : {};

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? 'no-store',
  });
}

// ── Public request with auto-refresh ─────────────────────────────────────────
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const res = await rawRequest(path, options);

  // On 401, attempt a silent token refresh then retry once
  if (res.status === 401 && typeof window !== 'undefined') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retry = await rawRequest(path, options);
      if (!retry.ok) {
        const payload = await retry.json().catch(() => ({}));
        throw new Error(payload?.message ?? `Request failed: ${retry.status}`);
      }
      const json = await retry.json();
      return (json.data ?? json) as T;
    }
    // Refresh failed — force logout
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message ?? `Request failed: ${res.status}`);
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

export const api = {
  get:    <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'GET', ...opts }),
  post:   <T>(path: string, body: Record<string, unknown>, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'POST', body, ...opts }),
  patch:  <T>(path: string, body: Record<string, unknown>, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'PATCH', body, ...opts }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'DELETE', ...opts }),
};