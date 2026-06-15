// src/actions/user-action.ts
'use server';

import { revalidatePath } from 'next/cache';
import { actionClient } from '@/lib/safeAction';
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from '@/schemas/user-schema';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id:        string;
  name:      string;
  email:     string;
  phone?:    string | null;
  status:    'ACTIVE' | 'INACTIVE';
  // The API returns nested objects, not flat IDs.
  // We derive roleId/branchId from these for form selects.
  role:      { id: string; name: string; color: string };
  branch:    { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
// ── CREATE ─────────────────────────────────────────────────────────────────────

export const createUser = actionClient
  .inputSchema(createUserSchema)
  .action(async (values) => {
    try {
      const { name, email, password, roleId, branchId, phone } = values.parsedInput;
      const user = await api.post<User>('/users', {
        name, email, password, roleId, branchId,
        ...(phone ? { phone } : {}),
      });
      revalidatePath('/users');
      return user;
    } catch (error: any) {
      console.error('Create User Error:', error);
      return { error: error?.message ?? 'Failed to create user. Please try again.' };
    }
  });

// ── LIST (paginated) ──────────────────────────────────────────────────────────

export async function getUsers(
  skip  = 0,
  limit = 10,
): Promise<{ users: User[]; totalCount: number }> {
  try {
    const qs = new URLSearchParams({
      skip:  String(skip),
      limit: String(limit),
    }).toString();
    const result = await api.get<
      { users: User[]; totalCount: number } | User[]
    >(`/users?${qs}`);

    if (Array.isArray(result)) {
      return { users: result.slice(skip, skip + limit), totalCount: result.length };
    }
    return result;
  } catch (error: any) {
    console.error('Get Users Error:', error);
    return { users: [], totalCount: 0 };
  }
}

// ── LIST (actionClient-wrapped) ───────────────────────────────────────────────

export const getUserList = actionClient.action(async () => {
  try {
    const users = await api.get<User[]>('/users');
    return users;
  } catch (error: any) {
    console.error('Get Users Error:', error);
    return { error: error?.message ?? 'Failed to fetch users.' };
  }
});

// ── UPDATE ─────────────────────────────────────────────────────────────────────

export const updateUser = actionClient
  .inputSchema(updateUserSchema)
  .action(async (values) => {
    const { id, ...data } = values.parsedInput;
    try {
      console.log('updateUser parsedInput:', values.parsedInput);
      const user = await api.patch<User>(`/users/${id}`, data as Record<string, unknown>);
      revalidatePath('/users');
      return user;
    } catch (error: any) {
      console.error('Update User Error:', error);
      return { error: error?.message ?? 'Failed to update user. Please try again.' };
    }
  });

// ── DELETE ─────────────────────────────────────────────────────────────────────

export const deleteUser = actionClient
  .inputSchema(deleteUserSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const result = await api.delete<{ id: string }>(`/users/${id}`);
      revalidatePath('/users');
      return result;
    } catch (error: any) {
      console.error('Delete User Error:', error);
      return { error: error?.message ?? 'Failed to delete user. Please try again.' };
    }
  });

// ── TOGGLE STATUS ──────────────────────────────────────────────────────────────

export const toggleUserStatus = actionClient
  .inputSchema(deleteUserSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const user = await api.patch<User>(`/users/${id}/toggle-status`, {});
      revalidatePath('/users');
      return user;
    } catch (error: any) {
      console.error('Toggle User Status Error:', error);
      return { error: error?.message ?? 'Something went wrong.' };
    }
  });