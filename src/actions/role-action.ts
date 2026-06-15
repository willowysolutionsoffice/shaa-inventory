// src/actions/role-action.ts
// Server actions / API wrappers for the role endpoints.

const API = process.env.API_URL
         ?? process.env.NEXT_PUBLIC_API_URL
         ?? "http://localhost:4000";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Role {
  id:          string;
  name:        string;
  description: string | null;
  color:       string;
  status:      "ACTIVE" | "INACTIVE";
  userCount:   number;
  permissions: { id: string; name: string; label: string | null }[];
  createdAt:   string;
  updatedAt:   string;
}

interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  message?: string;
}

// ── Helper ─────────────────────────────────────────────────────────────────────
// Dynamic import so `next/headers` is never bundled into the client build.
// On the server it reads the access_token cookie and forwards it.
// In the browser (client actions) credentials are sent via the fetch cookie jar.

async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {}; // browser — cookies sent automatically
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (token) return { Cookie: `access_token=${token}` };
  } catch {
    // Outside request context (e.g. during build) — skip auth header.
  }
  return {};
}

async function apiFetch<T>(
  path:  string,
  init?: RequestInit,
): Promise<{ data?: T; error?: string }> {
  try {
    const authHeader = await getAuthHeader();

    const res = await fetch(`${API}${path}`, {
      ...init,
      credentials: "include", // still needed for browser-side calls
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...init?.headers,
      },
    });

    const json: ApiResponse<T> = await res.json();

    if (!res.ok || !json.success) {
      return { error: json.message ?? "Request failed" };
    }

    return { data: json.data };
  } catch (err: any) {
    return { error: err?.message ?? "Network error" };
  }
}

// ── Actions ────────────────────────────────────────────────────────────────────

export async function getRoleList() {
  const result = await apiFetch<Role[]>("/roles");
  if (result.error) return { data: null, serverError: result.error };
  return { data: result.data };
}

export interface RoleOption {
  id:   string;
  name: string;
}

export async function getRoleListForDropdown(): Promise<RoleOption[]> {
  const result = await apiFetch<Role[]>("/roles");
  if (result.error || !result.data) return [];
  return result.data
    .filter((r) => r.status === "ACTIVE")
    .map(({ id, name }) => ({ id, name }));
}

export async function getRoleById(id: string) {
  const result = await apiFetch<Role>(`/roles/${id}`);
  if (result.error) return { data: null, serverError: result.error };
  return { data: result.data };
}

export async function createRole(input: {
  name:         string;
  description?: string;
  color?:       string;
  permissions:  string[];
}) {
  const result = await apiFetch<Role>("/roles", {
    method: "POST",
    body:   JSON.stringify(input),
  });
  if (result.error) return { data: { error: result.error } };
  return { data: { data: result.data } };
}

export async function updateRole(input: {
  id:           string;
  name?:        string;
  description?: string;
  color?:       string;
  status?:      "ACTIVE" | "INACTIVE";
  permissions?: string[];
}) {
  const { id, ...body } = input;
  const result = await apiFetch<Role>(`/roles/${id}`, {
    method: "PATCH",
    body:   JSON.stringify(body),
  });
  if (result.error) return { data: { error: result.error } };
  return { data: { data: result.data } };
}

export async function deleteRole(input: { id: string }) {
  const result = await apiFetch<{ id: string }>(`/roles/${input.id}`, {
    method: "DELETE",
  });
  if (result.error) return { data: { error: result.error }, serverError: undefined };
  return { data: { data: result.data }, serverError: undefined };
}

export async function toggleRoleStatus(input: { id: string }) {
  const result = await apiFetch<Role>(`/roles/${input.id}/toggle-status`, {
    method: "PATCH",
  });
  if (result.error) return { data: { error: result.error } };
  return { data: { data: result.data } };
}