'use server';

import { actionClient } from "@/lib/safeAction";
import { api } from "@/lib/api";
import {
  fullSalesSchema,
  getSalesByIdSchema,
  salesUpdateSchema,
} from "@/schemas/sales-item-schema";
import { SalesStatusEnum } from "@/schemas/sales-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function normalizeSale(s: any) {
  if (!s) return s;
  return {
    ...s,
    grandTotal: Number(s.grandTotal ?? 0),
    paidAmount: Number(s.paidAmount ?? 0),
    dueAmount:  Number(s.dueAmount  ?? s.paymentDue ?? 0),
    paymentDue: Number(s.paymentDue ?? 0),
    payments:   (s.payments ?? []).map((p: any) => ({
      ...p,
      amount: Number(p.amount),
    })),
    items: (s.items ?? []).map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      total:     Number(item.total),
    })),
  };
}

// ── Create ─────────────────────────────────────────────────────────────────────

export const createSale = actionClient
  .inputSchema(fullSalesSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { items, salesPayment, status, ...saleData } = parsedInput;

      const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const paidAmount = salesPayment.reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount  = grandTotal - paidAmount;

      const raw  = await api.post<any>('/sales', {
        ...saleData,
        status,
        grandTotal,
        paidAmount,
        dueAmount,
        items,
        salesPayment,
      });
      const sale = raw?.data ?? raw;

      revalidatePath('/sales');
      return { data: normalizeSale(sale) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// ── List ───────────────────────────────────────────────────────────────────────

export const getSalesList = actionClient
  .inputSchema(z.object({
    page:     z.number().default(1),
    limit:    z.number().default(10),
    from:     z.string().optional(),
    to:       z.string().optional(),
    branchId: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const { page, limit, from, to, branchId } = parsedInput;

      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(from     && { from }),
        ...(to       && { to }),
        ...(branchId && { branchId }),
      });
console.log("SALES PARAMS:", {
  page,
  limit,
  from,
  to,
});
      const raw = await api.get<any>(`/sales?${params}`);
      // backend: { success, data: { sales, metadata, totals } }
      console.log("SALES RAW:", raw);

      const payload = raw?.data ?? raw;
console.log("SALES PAYLOAD:", payload);
      return {
        sales:    (payload.sales    ?? []).map(normalizeSale),
        metadata: payload.metadata  ?? {
          totalPages: 0, totalCount: 0, currentPage: 1,
          hasNextPage: false, hasPrevPage: false,
        },
        totals:   payload.totals    ?? { grandTotal: 0, paidAmount: 0, dueAmount: 0 },
      };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export async function fetchSales(params: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  branchId?: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    ...(params.from && { from: params.from }),
    ...(params.to && { to: params.to }),
    ...(params.branchId && { branchId: params.branchId }),
  });

  const raw = await api.get<any>(`/sales?${query}`);

  return {
    sales: (raw.sales ?? []).map(normalizeSale),
    metadata: raw.metadata,
    totals: raw.totals,
  };
}

// ── Get by ID ──────────────────────────────────────────────────────────────────

export const getSaleById = actionClient
  .inputSchema(getSalesByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw  = await api.get<any>(`/sales/${parsedInput.id}`);
      const sale = raw?.data ?? raw;
      return { data: normalizeSale(sale) };
    } catch (error: any) {
      return { error: error.message ?? 'Sale not found' };
    }
  });

// ── Update ─────────────────────────────────────────────────────────────────────

export const updateSale = actionClient
  .inputSchema(salesUpdateSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, items, salesPayment, status, ...data } = parsedInput;

      const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const paidAmount = salesPayment.reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount  = grandTotal - paidAmount;

      const raw  = await api.patch<any>(`/sales/${id}`, {
        ...data,
        status,
        grandTotal,
        paidAmount,
        dueAmount,
        items,
        salesPayment,
      });
      const sale = raw?.data ?? raw;

      revalidatePath('/sales');
      return { data: normalizeSale(sale) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// ── Update status ──────────────────────────────────────────────────────────────

export const updateSalesStatus = actionClient
  .inputSchema(z.object({ id: z.string(), status: SalesStatusEnum }))
  .action(async ({ parsedInput }) => {
    try {
      const raw  = await api.patch<any>(`/sales/${parsedInput.id}/status`, {
        status: parsedInput.status,
      });
      const sale = raw?.data ?? raw;

      revalidatePath('/sales');
      return { data: normalizeSale(sale) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// ── Delete ─────────────────────────────────────────────────────────────────────

export const deleteSale = actionClient
  .inputSchema(getSalesByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw = await api.delete<any>(`/sales/${parsedInput.id}`);
      revalidatePath('/sales');
      return { data: raw?.data ?? raw };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });