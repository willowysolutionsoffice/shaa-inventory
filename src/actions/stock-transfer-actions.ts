'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

// ── Schemas ───────────────────────────────────────────────────────────────────

const transferItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity:  z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

const createTransferSchema = z.object({
  fromBranchId: z.string().min(1, 'Source branch is required'),
  toBranchId:   z.string().min(1, 'Destination branch is required'),
  note:         z.string().optional(),
  items:        z.array(transferItemSchema).min(1, 'At least one item is required'),
});

const listTransfersSchema = z.object({
  page:         z.coerce.number().optional().default(1),
  limit:        z.coerce.number().optional().default(10),
  branchId:     z.string().optional(),
  fromBranchId: z.string().optional(),
  toBranchId:   z.string().optional(),
  status:       z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  search:       z.string().optional(),
});

const getTransferByIdSchema = z.object({
  id: z.string().min(1),
});

const cancelTransferSchema = z.object({
  id: z.string().min(1),
});

// ── Normalizer ────────────────────────────────────────────────────────────────

function normalizeTransfer(t: any) {
  return {
    ...t,
    fromBranchName: t.fromBranch?.name ?? t.fromBranchName ?? 'Unknown',
    toBranchName:   t.toBranch?.name   ?? t.toBranchName   ?? 'Unknown',
    itemCount:      t.items?.length    ?? t.itemCount       ?? 0,
    items: (t.items ?? []).map((i: any) => ({
      ...i,
      product_name: i.product?.productName ?? i.product_name ?? 'Unknown',
      sku:          i.product?.sku         ?? i.sku          ?? '',
    })),
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

export const createStockTransfer = actionClient
  .inputSchema(createTransferSchema)
  .action(async ({ parsedInput }) => {
    try {
      const transfer = await api.post<any>('/stock-transfers', parsedInput);
      revalidatePath('/admin/stock-transfer');
      revalidatePath('/admin/stock-transfer/history');
      revalidatePath('/admin/stock-adjustment');
      return { data: normalizeTransfer(transfer) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getStockTransfers = actionClient
  .inputSchema(listTransfersSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { page, limit, branchId, fromBranchId, toBranchId, status, search } = parsedInput;
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(branchId     && { branchId }),
        ...(fromBranchId && { fromBranchId }),
        ...(toBranchId   && { toBranchId }),
        ...(status       && { status }),
        ...(search       && { search }),
      });
      const payload = await api.get<any>(`/stock-transfers?${params}`);
      if (payload?.transfers) {
        payload.transfers = payload.transfers.map(normalizeTransfer);
      }
      return { data: payload };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getStockTransferById = actionClient
  .inputSchema(getTransferByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const transfer = await api.get<any>(`/stock-transfers/${parsedInput.id}`);
      return { data: normalizeTransfer(transfer) };
    } catch (error: any) {
      return { error: error.message ?? 'Transfer not found' };
    }
  });

export const cancelStockTransfer = actionClient
  .inputSchema(cancelTransferSchema)
  .action(async ({ parsedInput }) => {
    try {
      const transfer = await api.patch<any>(`/stock-transfers/${parsedInput.id}/cancel`, {});
      revalidatePath('/admin/stock-transfer/history');
      return { data: normalizeTransfer(transfer) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// ── Non-action helper (dropdown / SSR) ───────────────────────────────────────

export async function getBranchDropdown() {
  try {
    const branches = await api.get<any[]>('/branches/dropdown');
    return branches ?? [];
  } catch {
    return [];
  }
}