// src/lib/auth-client.ts  (Next.js frontend replacement — real API calls)
// Drop-in replacement for the mock auth-client.ts.

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id:          string;
  name:        string;
  email:       string;
  role:        string;
  branchId:    string;
  branch:      string;
  permissions: string[];
  status:      string;
}

interface SessionResponse {
  data: { user: SessionUser } | null;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',   // send/receive httpOnly cookies
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json;
}

// ── Auth client (mirrors original authClient shape) ───────────────────────────

export const authClient = {
  // ── Session ────────────────────────────────────────────────────────────────
  getSession: async (): Promise<SessionResponse> => {
    try {
      const json = await apiFetch<{ success: boolean; data: SessionUser }>('/auth/me');
      return { data: { user: json.data } };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    return apiFetch<{ success: boolean; data: { user: SessionUser; accessToken: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    return apiFetch('/auth/logout', { method: 'POST' });
  },

  // ── Refresh ────────────────────────────────────────────────────────────────
  refresh: async () => {
    return apiFetch('/auth/refresh', { method: 'POST' });
  },

  // ── Admin: user management (replaces mock admin.removeUser / setRole) ───────
  admin: {
    createUser: async (data: {
      name: string; email: string; password: string;
      roleId: string; branchId: string; phone?: string;
    }) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),

    listUsers: async (params?: { skip?: number; take?: number; branchId?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiFetch(`/users${qs ? `?${qs}` : ''}`);
    },

    updateUser: async (userId: string, data: Record<string, unknown>) =>
      apiFetch(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),

    removeUser: async (userId: string) =>
      apiFetch(`/users/${userId}`, { method: 'DELETE' }),
  },
};