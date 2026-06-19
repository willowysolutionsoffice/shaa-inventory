import { apiRequest } from './api';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

// Auth endpoints only — no retry loop (these ARE the retry mechanism)
async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json;
}

export const authClient = {
  getSession: async (): Promise<SessionResponse> => {
    try {
      const data = await apiRequest<SessionUser>('/auth/me');
      return { data: { user: data } };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  login: (email: string, password: string) =>
    authFetch<{ success: boolean; data: { user: SessionUser; accessToken: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  logout:  () => authFetch('/auth/logout',  { method: 'POST' }),
  refresh: () => authFetch('/auth/refresh', { method: 'POST' }),

  admin: {
    createUser: (data: { name: string; email: string; password: string; roleId: string; branchId: string; phone?: string }) =>
      apiRequest('/users', { method: 'POST', body: data }),
    listUsers: (params?: { skip?: number; take?: number; branchId?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiRequest(`/users${qs ? `?${qs}` : ''}`);
    },
    updateUser: (userId: string, data: Record<string, unknown>) =>
      apiRequest(`/users/${userId}`, { method: 'PATCH', body: data }),
    removeUser: (userId: string) =>
      apiRequest(`/users/${userId}`, { method: 'DELETE' }),
  },
};