// src/lib/api.ts
// Unified fetch wrapper that matches auth-client.ts's cookie-based auth strategy.
//
// Auth flow (mirrors auth-client.ts):
//   • The Express backend sets the refreshToken in an httpOnly cookie and
//     returns the accessToken in the JSON response body.
//   • auth-client.ts uses `credentials: 'include'` so the browser sends
//     cookies automatically (works only in client components / client-side
//     Server Actions that run in the browser context).
//   • For true RSC / Server Action calls that originate on the Node.js server
//     we must forward the incoming Cookie header manually, because Node fetch
//     does not share the browser's cookie jar.
//
// This file uses the same strategy for every environment:
//   Client-side  → credentials: 'include'  (browser forwards cookies)
//   Server-side  → reads cookies() from next/headers and forwards them as a
//                  Cookie header so the Express middleware can verify the token.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown>;
};

// Build the extra headers needed when running on the server.
async function serverCookieHeader(): Promise<Record<string, string>> {
  try {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    // Reconstruct the raw Cookie header string from the Next.js cookie store.
    const raw = store
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    return raw ? { Cookie: raw } : {};
  } catch {
    // next/headers throws outside of a request context (e.g. during build).
    return {};
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const isServer = typeof window === 'undefined';

  // On the server we forward cookies manually; on the client the browser
  // handles them via credentials:'include' — exactly what auth-client.ts does.
  const extraHeaders = isServer ? await serverCookieHeader() : {};

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',          // client-side: browser sends cookie jar
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,               // server-side: forwarded Cookie header
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? 'no-store',
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message ?? `Request failed: ${res.status}`);
  }

  const json = await res.json();
  // Express controllers always return { success: true, data: ... }
return (json.data ?? json) as T;}

// Convenience aliases — same surface as auth-client.ts's apiFetch but typed.
export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'GET', ...opts }),

  post: <T>(path: string, body: Record<string, unknown>, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'POST', body, ...opts }),

  patch: <T>(path: string, body: Record<string, unknown>, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'PATCH', body, ...opts }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { method: 'DELETE', ...opts }),
};