'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const supplierSchema = z.object({
  SupplierId:     z.string().min(1, 'Supplier ID is required'),
  name:           z.string().min(1, 'Name is required'),
  email:          z.string().optional(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  openingBalance: z.coerce.number().optional().default(0),
  branchId:       z.string().min(1, 'Branch is required'),
});

const updateSupplierSchema = supplierSchema.partial().extend({
  id: z.string().min(1),
});

const deleteSupplierSchema = z.object({
  id: z.string().min(1),
});

function normalizeSupplier(s: any) {
  return {
    ...s,
    openingBalance:    Number(s.openingBalance    ?? 0),
    purchaseDue:       Number(s.purchaseDue       ?? 0),
    purchaseReturnDue: Number(s.purchaseReturnDue ?? 0),
  };
}

export const createSupplier = actionClient
  .inputSchema(supplierSchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw = await api.post<any>('/suppliers', parsedInput);
      const supplier = raw?.data ?? raw;
      revalidatePath('/suppliers');
      return { data: normalizeSupplier(supplier) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to create supplier' };
    }
  });

export const getSupplierList = actionClient
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      const raw     = await api.get<any>('/suppliers');
      const payload = raw?.data ?? raw;
      return {
        suppliers: (payload.suppliers ?? []).map(normalizeSupplier),
        totals:    payload.totals ?? {
          openingBalance: 0, purchaseDue: 0, purchaseReturnDue: 0,
        },
      };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to fetch suppliers' };
    }
  });

export const getSupplierListForDropdown = async () => {
  try {
    const raw       = await api.get<any>('/suppliers/dropdown');
    const suppliers = raw?.data ?? raw;
    return (Array.isArray(suppliers) ? suppliers : []).map((s: any) => ({
      id:             s.id,
      name:           s.name,
      openingBalance: Number(s.openingBalance ?? 0),
    }));
  } catch {
    return [];
  }
};

export const updateSupplier = actionClient
  .inputSchema(updateSupplierSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...rest } = parsedInput;
      const raw      = await api.patch<any>(`/suppliers/${id}`, rest);
      const supplier = raw?.data ?? raw;
      revalidatePath('/suppliers');
      return { data: normalizeSupplier(supplier) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to update supplier' };
    }
  });

export const deleteSupplier = actionClient
  .inputSchema(deleteSupplierSchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw = await api.delete<any>(`/suppliers/${parsedInput.id}`);
      revalidatePath('/suppliers');
      return { data: raw?.data ?? raw };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to delete supplier' };
    }
  });