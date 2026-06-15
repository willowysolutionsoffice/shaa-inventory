// src/actions/branch-action.ts
'use server';

import { revalidatePath } from 'next/cache';
import { actionClient } from '@/lib/safeAction';
import { branchSchema, deleteBranchSchema, updateBranchSchema } from '@/schemas/branch-schema';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    products: number;
    sales: number;
    purchases: number;
  };
}

export interface BranchDropdownItem {
  id: string;
  name: string;
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createBranch = actionClient
  .inputSchema(branchSchema)
  .action(async (values) => {
    try {
      const branch = await api.post<Branch>('/branches', values.parsedInput);
      revalidatePath('/branch');
      return { data: branch };
    } catch (error: any) {
      console.error('Create Branch Error:', error);
      return { error: error?.message ?? 'Failed to create branch. Please try again.' };
    }
  });

// ── LIST ──────────────────────────────────────────────────────────────────────

export const getBranchList = actionClient.action(async () => {
  try {
    const branches = await api.get<Branch[]>('/branches');
    return { data: branches };
  } catch (error: any) {
    console.error('Get Branch List Error:', error);
    return { error: error?.message ?? 'Failed to fetch branches.' };
  }
});

// ── DROPDOWN ──────────────────────────────────────────────────────────────────

export const getBranchListForDropdown = async (): Promise<BranchDropdownItem[]> => {
  try {
    return await api.get<BranchDropdownItem[]>('/branches/dropdown');
  } catch (error) {
    console.error('Branch Dropdown Error:', error);
    return [];
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateBranch = actionClient
  .inputSchema(updateBranchSchema)
  .action(async (values) => {
    const { id, ...data } = values.parsedInput;
    try {
      const branch = await api.patch<Branch>(`/branches/${id}`, data);
      revalidatePath('/branch');
      return { data: branch };
    } catch (error: any) {
      console.error('Update Branch Error:', error);
      return { error: error?.message ?? 'Failed to update branch. Please try again.' };
    }
  });

// ── DELETE ────────────────────────────────────────────────────────────────────

export const deleteBranch = actionClient
  .inputSchema(deleteBranchSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const result = await api.delete<{ id: string }>(`/branches/${id}`);
      revalidatePath('/branch');
      return { data: result };
    } catch (error: any) {
      console.error('Delete Branch Error:', error);
      return { error: error?.message ?? 'Failed to delete branch. Please try again.' };
    }
  });