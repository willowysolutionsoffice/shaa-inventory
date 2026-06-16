// src/actions/customer-action.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import {
  customerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
} from '@/schemas/customer-schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Normalise Prisma decimals / field aliases ──────────────────────────────────

function normalizeCustomer(c: any): any {
  if (!c) return c;
  return {
    ...c,
    openingBalance: Number(c.openingBalance ?? 0),
  };
}

// ── Plain async — safe to call from server components (same as getProductDropdown) ──

export const getCustomerListForDropdown = async (
  branchId?: string
): Promise<{ id: string; name: string; phone: string }[]> => {
  try {
    const params  = branchId ? `?branchId=${branchId}` : '';
    const raw     = await api.get<any>(`/customers/dropdown${params}`);
    return (raw ?? []).map((c: any) => ({
      id:    c.id,
      name:  c.name,
      phone: c.phone ?? '',
    }));
  } catch {
    return [];
  }
};

export const fetchCustomers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
}) => {
  try {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 500),
      ...(params?.search && { search: params.search }),
      ...(params?.branchId && { branchId: params.branchId }),
    });

    const payload = await api.get<any>(`/customers?${qs}`);

    console.log("CUSTOMERS PAYLOAD:", payload);

    return {
      customers: payload?.customers ?? [],
      metadata: payload?.metadata,
    };
  } catch (error) {
    console.error(error);
    return {
      customers: [],
      metadata: {},
    };
  }
};

// ── actionClient — for mutations and client-side useAction calls ───────────────

export const createCustomer = actionClient
  .inputSchema(customerSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { name, email, phone, branchId } = parsedInput;
      const raw = await api.post<any>('/customers', {
        name,
        email:    email    || undefined,
        phone:    phone    || undefined,
        branchId,
      });
      revalidatePath('/customers');
      return { data: normalizeCustomer(raw) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to create customer' };
    }
  });

export const updateCustomer = actionClient
  .inputSchema(updateCustomerSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, name, email, phone, branchId } = parsedInput;
      const raw = await api.patch<any>(`/customers/${id}`, {
        name,
        email:    email    || undefined,
        phone:    phone    || undefined,
        branchId,
      });
      revalidatePath('/customers');
      return { data: normalizeCustomer(raw) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to update customer' };
    }
  });

export const deleteCustomer = actionClient
  .inputSchema(deleteCustomerSchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw = await api.delete<any>(`/customers/${parsedInput.id}`);
      revalidatePath('/customers');
      return { data: raw };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to delete customer' };
    }
  });

export const getCustomerById = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    try {
      const payload = await api.get<any>(`/customers/${parsedInput.id}`);
      return {
        customer:      normalizeCustomer(payload?.customer ?? null),
        sales:         payload?.sales         ?? [],
        returns:       payload?.returns       ?? [],
        loyaltyPoints: payload?.loyaltyPoints ?? 0,
        loyaltyTier:   payload?.loyaltyTier   ?? 'Bronze',
        totalSpent:    payload?.totalSpent    ?? 0,
        totalReturned: payload?.totalReturned ?? 0,
      };
    } catch (error: any) {
      return { error: error.message ?? 'Customer not found' };
    }
  });

// ── getCustomerList — actionClient wrapper around fetchCustomers ───────────────

export const getCustomerList = actionClient
  .inputSchema(z.object({
    page:     z.coerce.number().optional().default(1),
    limit:    z.coerce.number().optional().default(50),
    search:   z.string().optional(),
    branchId: z.string().optional(),
  }).optional().default({}))
  .action(async ({ parsedInput }) => {
    return fetchCustomers(parsedInput ?? {});
  });