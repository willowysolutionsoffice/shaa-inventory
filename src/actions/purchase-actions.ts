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

function normalizePurchase(p: any) {
  const paymentDue  = Number(p.paymentDue  ?? 0);
  const totalAmount = Number(p.totalAmount ?? 0);
  const paidAmount  = totalAmount - paymentDue;

  // Opening balance lives on the supplier relation
  const supplierOpeningBalance = Number(p.supplier?.openingBalance ?? 0);

  return {
    ...p,
    purchaseNo:    p.purchaseNo,
    paymentStatus: p.paymentStatus,
    paymentDue,
    totalAmount,
    paidAmount,
    // Surface opening balance so the frontend can rebuild the summary row
    supplierOpeningBalance,
    // totalPayable = openingBalance + merchandise total
    totalPayable:  supplierOpeningBalance + totalAmount,
    referenceNo:   p.purchaseNo,
    dueAmount:     paymentDue,
    items: (p.items ?? []).map((item: any) => ({
      ...item,
      product_name: item.product?.productName ?? '',
      unitPrice:    Number(item.unitPrice),
      total:        Number(item.total),
      discount:     0,
      subtotal:     Number(item.total),
    })),
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

      // totalPayable is passed through so the backend can store the correct
      // paymentDue (openingBalance + grandTotal − amountPaid).
      // It lives in parsedInput if the schema includes it; fall back gracefully.
      const totalPayable = (parsedInput as any).totalPayable ?? undefined;

      const raw = await api.post<any>('/purchases', {
        purchaseDate,
        supplierId,
        branchId,
        totalPayable,
        items: items.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: i.unitPrice,
          total:     i.quantity * i.unitPrice,
        })),
        payments: payments.map(p => ({
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

      const totalPayable = (parsedInput as any).totalPayable ?? undefined;

      const raw = await api.patch<any>(`/purchases/${id}`, {
        purchaseDate,
        supplierId,
        branchId,
        totalPayable,
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

// ── REPORT ─────────────────────────────────────────────────────────────────────
// Item-wise purchase report. Mirrors getSalesReport: runs server-side so
// cookies/auth forward correctly, only date/branch/supplier are filtered on
// the API — brand / sub-brand filtering happens client-side against the
// product metadata carried on each item (see the report page component).

export async function getPurchaseReport(params: {
  from?: string;
  to?: string;
  branchId?: string;
  supplierId?: string;
  limit?: number;
  page?: number;
}): Promise<{ purchases: any[] } | { error: string }> {
  try {
    const query = new URLSearchParams({
      page:  String(params.page  ?? 1),
      limit: String(params.limit ?? 500),
      ...(params.from       && { from:       params.from }),
      ...(params.to         && { to:         params.to }),
      ...(params.branchId   && { branchId:   params.branchId }),
      ...(params.supplierId && { supplierId: params.supplierId }),
    });

    const raw     = await api.get<any>(`/purchases?${query}`);
    const payload = raw?.data ?? raw;

    return {
      purchases: payload?.purchases ?? payload ?? [],
    };
  } catch (error: any) {
    return { error: error.message ?? 'Failed to fetch purchase report' };
  }
}