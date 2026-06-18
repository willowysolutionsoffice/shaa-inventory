'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Role {
  id:          string;
  name:        string;
  description: string | null;
  color:       string;
  status:      'ACTIVE' | 'INACTIVE';
  userCount:   number;
  permissions: { id: string; name: string; label: string | null }[];
  createdAt:   string;
  updatedAt:   string;
}

export interface RoleOption {
  id:   string;
  name: string;
}

// ── Schemas ────────────────────────────────────────────────────────────────────

const createRoleSchema = z.object({
  name:        z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  color:       z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
});

const updateRoleSchema = createRoleSchema.partial().extend({
  id:     z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const deleteRoleSchema = z.object({
  id: z.string().min(1),
});

const getRoleByIdSchema = z.object({
  id: z.string().min(1),
});

const toggleRoleStatusSchema = z.object({
  id: z.string().min(1),
});

// ── Normalizer ─────────────────────────────────────────────────────────────────

function normalizeRole(r: any): Role {
  return {
    id:          r.id,
    name:        r.name         ?? '',
    description: r.description  ?? null,
    color:       r.color        ?? 'GRAY',
    status:      r.status       ?? 'INACTIVE',
    userCount:   Number(r.userCount ?? 0),
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
    createdAt:   r.createdAt    ?? '',
    updatedAt:   r.updatedAt    ?? '',
  };
}

// ── Actions ────────────────────────────────────────────────────────────────────

export const getRoleList = actionClient
  .action(async () => {
    try {
      const roles = await api.get<any[]>('/roles');
      return { data: (roles ?? []).map(normalizeRole) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to load roles' };
    }
  });

export const getRoleById = actionClient
  .inputSchema(getRoleByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role = await api.get<any>(`/roles/${parsedInput.id}`);
      return { data: normalizeRole(role) };
    } catch (error: any) {
      return { error: error.message ?? 'Role not found' };
    }
  });

export const createRole = actionClient
  .inputSchema(createRoleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role = await api.post<any>('/roles', parsedInput);
      revalidatePath('/roles');
      return { data: normalizeRole(role) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateRole = actionClient
  .inputSchema(updateRoleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...body } = parsedInput;
      const role = await api.patch<any>(`/roles/${id}`, body);
      revalidatePath('/roles');
      return { data: normalizeRole(role) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteRole = actionClient
  .inputSchema(deleteRoleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await api.delete<any>(`/roles/${parsedInput.id}`);
      revalidatePath('/roles');
      return { data: result };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const toggleRoleStatus = actionClient
  .inputSchema(toggleRoleStatusSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role = await api.patch<any>(`/roles/${parsedInput.id}/toggle-status`, {});
      revalidatePath('/roles');
      return { data: normalizeRole(role) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// ── Non-action helper (dropdown, no server-action overhead) ───────────────────

export async function getRoleListForDropdown(): Promise<RoleOption[]> {
  try {
    const roles = await api.get<any[]>('/roles');
    return (roles ?? [])
      .filter((r: any) => r.status === 'ACTIVE')
      .map(({ id, name }: any) => ({ id, name }));
  } catch {
    return [];
  }
}