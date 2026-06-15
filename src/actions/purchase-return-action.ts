'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import {
  fullPurchaseReturnSchema,
  getPurchaseReturnByIdSchema,
  updateFullPurchaseReturnSchema,
} from '@/schemas/purchase-return-item-schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Normalise a purchase return from the API ───────────────────────────────────
// Backend stores returnNo; form/table uses referenceNo — expose both.

function normalizePurchaseReturn(r: any) {
  const normalizedItems = (r.items ?? []).map((item: any) => ({
    ...item,
    product_name: item.product?.productName ?? '',
    unitPrice:    Number(item.unitPrice),
    total:        Number(item.total),
  }));

  return {
    ...r,
    totalAmount:        Number(r.totalAmount ?? 0),
    // alias: backend field → frontend field
    referenceNo:        r.returnNo,          // table column uses referenceNo
    items:              normalizedItems,
    purchaseReturnItem: normalizedItems,     // alias used by the form
  };
}

// ── CREATE ─────────────────────────────────────────────────────────────────────

export const createPurchaseReturn = actionClient
  .inputSchema(fullPurchaseReturnSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { purchaseReturnItem, returnDate, purchaseId, supplierId, branchId } = parsedInput;

      if (!purchaseId) {
        return { error: 'purchaseId is required' };
      }

      const purchaseReturn = await api.post<any>('/purchase-returns', {
        returnDate,
        purchaseId,
        supplierId,
        branchId,
        items: purchaseReturnItem.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: i.unitPrice,
          total:     i.total ?? i.quantity * i.unitPrice,
        })),
      });

      revalidatePath('/purchase-returns');
      return { data: normalizePurchaseReturn(purchaseReturn) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to create purchase return' };
    }
  });

// ── LIST ───────────────────────────────────────────────────────────────────────

export const getPurchaseReturnList = actionClient
  .inputSchema(
    z.object({
      page:  z.number().default(1),
      limit: z.number().default(10),
      from:  z.string().optional(),
      to:    z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const { page, limit, from, to } = parsedInput;

      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(from && { from }),
        ...(to   && { to }),
      });

      const payload = await api.get<any>(`/purchase-returns?${params}`);

      return {
        returns:  (payload.returns ?? []).map(normalizePurchaseReturn),
        metadata: payload.metadata ?? { totalPages: 0, totalCount: 0, currentPage: 1, hasNextPage: false, hasPrevPage: false },
        totals:   payload.totals   ?? { totalAmount: 0 },
      };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to fetch purchase returns' };
    }
  });

// ── GET BY ID ──────────────────────────────────────────────────────────────────

export const getPurchaseReturnById = actionClient
  .inputSchema(getPurchaseReturnByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const purchaseReturn = await api.get<any>(`/purchase-returns/${parsedInput.id}`);
      return { data: normalizePurchaseReturn(purchaseReturn) };
    } catch (error: any) {
      return { error: error.message ?? 'Purchase return not found' };
    }
  });

// ── UPDATE ─────────────────────────────────────────────────────────────────────

export const updatePurchaseReturn = actionClient
  .inputSchema(updateFullPurchaseReturnSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, purchaseReturnItem, returnDate, purchaseId, supplierId, branchId } = parsedInput;

      const purchaseReturn = await api.patch<any>(`/purchase-returns/${id}`, {
        returnDate,
        purchaseId,
        supplierId,
        branchId,
        items: purchaseReturnItem?.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: i.unitPrice,
          total:     i.total ?? i.quantity * i.unitPrice,
        })),
      });

      revalidatePath('/purchase-returns');
      return { data: normalizePurchaseReturn(purchaseReturn) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to update purchase return' };
    }
  });

// ── DELETE ─────────────────────────────────────────────────────────────────────

export const deletePurchaseReturn = actionClient
  .inputSchema(getPurchaseReturnByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const purchaseReturn = await api.delete<any>(`/purchase-returns/${parsedInput.id}`);
      revalidatePath('/purchase-returns');
      return { data: purchaseReturn };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to delete purchase return' };
    }
  });