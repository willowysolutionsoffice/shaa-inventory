'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import {
  fullPurchaseSchema,
  getPurchaseByIdSchema,
  purchaseUpdateSchema,
} from '@/schemas/purchase-item-schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Normalize a purchase coming from the API ───────────────────────────────────
// Prisma fields:  purchaseNo, paymentStatus (PENDING|PARTIAL|PAID), paymentDue, totalAmount
// Frontend needs: referenceNo (alias), dueAmount (alias), paidAmount (derived)

function normalizePurchase(p: any) {
  const paymentDue  = Number(p.paymentDue  ?? 0);
  const totalAmount = Number(p.totalAmount ?? 0);
  const paidAmount  = totalAmount - paymentDue;

  return {
    ...p,
    // canonical Prisma fields
    purchaseNo:    p.purchaseNo,
    paymentStatus: p.paymentStatus,   // 'PENDING' | 'PARTIAL' | 'PAID'
    paymentDue,
    totalAmount,
    // frontend aliases
    referenceNo: p.purchaseNo,
    dueAmount:   paymentDue,
    paidAmount,
    // normalise items  (PurchaseItem has no discount/subtotal in DB)
    items: (p.items ?? []).map((item: any) => ({
      ...item,
      product_name: item.product?.productName ?? '',
      unitPrice:    Number(item.unitPrice),
      total:        Number(item.total),
      // provide zeros for form fields that don't exist on the model
      discount: 0,
      subtotal: Number(item.total),
    })),
    // normalise payments
    payments: (p.payments ?? []).map((pay: any) => ({
      ...pay,
      amount: Number(pay.amount),
    })),
  };
}

// ── CREATE ─────────────────────────────────────────────────────────────────────

export const createPurchase = actionClient
  .inputSchema(fullPurchaseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { items, payments, purchaseDate, supplierId, branchId } = parsedInput;

      const raw = await api.post<any>('/purchases', {
        purchaseDate,
        supplierId,
        branchId,
        items: items.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: i.unitPrice,
          // backend calculates total as quantity * unitPrice; discount not stored
          total: i.quantity * i.unitPrice,
        })),
        payments: payments.map(p => ({
          amount:        p.amount,
          paidOn:        p.paidOn,
          paymentMethod: p.paymentMethod,
          paymentNote:   p.paymentNote ?? null,
          dueDate:       p.dueDate ?? null,
        })),
      });

      // backend wraps: { success, data }
      const purchase = raw?.data ?? raw;

      revalidatePath('/purchase');
      return { data: normalizePurchase(purchase) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to create purchase' };
    }
  });

// ── LIST ───────────────────────────────────────────────────────────────────────

export const getPurchaseList = actionClient
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

      // backend: { success: true, data: { purchases, metadata, totals } }
      const raw     = await api.get<any>(`/purchases?${params}`);
      const payload = raw?.data ?? raw;

      return {
        purchases: (payload.purchases ?? []).map(normalizePurchase),
        metadata:  payload.metadata ?? {
          totalPages:  0,
          totalCount:  0,
          currentPage: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        totals: payload.totals ?? { totalAmount: 0, dueAmount: 0, paidAmount: 0 },
      };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to fetch purchases' };
    }
  });

// ── GET BY ID ──────────────────────────────────────────────────────────────────

export const getPurchaseById = actionClient
  .inputSchema(getPurchaseByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      // backend: { success: true, data: purchase }
      const raw      = await api.get<any>(`/purchases/${parsedInput.id}`);
      const purchase = raw?.data ?? raw;
      return { data: normalizePurchase(purchase) };
    } catch (error: any) {
      return { error: error.message ?? 'Purchase not found' };
    }
  });

// ── UPDATE ─────────────────────────────────────────────────────────────────────

export const updatePurchase = actionClient
  .inputSchema(purchaseUpdateSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, items, payments, purchaseDate, supplierId, branchId } = parsedInput;

      const raw = await api.patch<any>(`/purchases/${id}`, {
        purchaseDate,
        supplierId,
        branchId,
        items: items?.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: i.unitPrice,
          total:     i.quantity * i.unitPrice,
        })),
        payments: payments?.map(p => ({
          amount:        p.amount,
          paidOn:        p.paidOn,
          paymentMethod: p.paymentMethod,
          paymentNote:   p.paymentNote ?? null,
          dueDate:       p.dueDate ?? null,
        })),
      });

      const purchase = raw?.data ?? raw;

      revalidatePath('/purchase');
      return { data: normalizePurchase(purchase) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to update purchase' };
    }
  });

// ── DELETE ─────────────────────────────────────────────────────────────────────

export const deletePurchase = actionClient
  .inputSchema(getPurchaseByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw      = await api.delete<any>(`/purchases/${parsedInput.id}`);
      const purchase = raw?.data ?? raw;
      revalidatePath('/purchase');
      return { data: purchase };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to delete purchase' };
    }
  });