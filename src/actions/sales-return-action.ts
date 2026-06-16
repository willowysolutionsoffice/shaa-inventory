'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import {
  posRefundSchema,
  createSalesReturnSchema,
  updateSalesReturnSchema,
  listSalesReturnsSchema,
  getSalesReturnByIdSchema,
} from '@/schemas/sales-return-schema';

function normalizeSalesReturn(r: any) {
  return {
    id:           r?.id          ?? '',
    returnNo:     r?.returnNo    ?? '',
    returnDate:   r?.returnDate  ?? null,
    saleId:       r?.saleId      ?? '',
    customerId:   r?.customerId  ?? '',
    branchId:     r?.branchId    ?? '',
    refundMethod: String(r?.refundMethod ?? '').toLowerCase(),
    reason:       r?.reason      ?? null,
    grandTotal:   Number(r?.grandTotal ?? 0),
    sale:         r?.sale        ?? null,
    customer:     r?.customer    ?? null,
    branch:       r?.branch      ?? null,
    items: (r?.items ?? []).map((i: any) => ({
      id:          i.id,
      productId:   i.productId,
      quantity:    i.quantity,
      unitPrice:   Number(i.unitPrice),
      subtotal:    Number(i.subtotal),
      total:       Number(i.total),
      product:     i.product ?? null,
      product_name: i.product?.productName ?? i.product?.product_name ?? '',
    })),
  };
}

const PATHS = ['/sales-returns', '/sales', '/sales/pos'];
const revalidateAll = () => PATHS.forEach(revalidatePath);

export const posRefund = actionClient
  .inputSchema(posRefundSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.post<any>('/sales-returns', {
      saleId:       parsedInput.saleId,
      refundMethod: parsedInput.refundMethod,
      reason:       parsedInput.reason,
      items:        parsedInput.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    revalidateAll();
    return normalizeSalesReturn(raw?.data ?? raw);
  });

export const createSalesReturn = actionClient
  .inputSchema(createSalesReturnSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.post<any>('/sales-returns', {
      saleId:       parsedInput.saleId,
      refundMethod: parsedInput.refundMethod,
      reason:       parsedInput.reason ?? null,
      items:        parsedInput.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    revalidateAll();
    return normalizeSalesReturn(raw?.data ?? raw);
  });

export const updateSalesReturn = actionClient
  .inputSchema(updateSalesReturnSchema)
  .action(async ({ parsedInput }) => {
    const { id, items, ...rest } = parsedInput;
    const raw = await api.patch<any>(`/sales-returns/${id}`, {
      ...rest,
      items: items?.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    revalidateAll();
    return normalizeSalesReturn(raw?.data ?? raw);
  });

export const deleteSalesReturn = actionClient
  .inputSchema(getSalesReturnByIdSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.delete<any>(`/sales-returns/${parsedInput.id}`);
    revalidateAll();
    return normalizeSalesReturn(raw?.data ?? raw);
  });

export const getSalesReturnList = actionClient
  .inputSchema(listSalesReturnsSchema)
  .action(async ({ parsedInput }) => {
    const { page, limit, saleId, branchId } = parsedInput;
    const params = new URLSearchParams({
      page:  String(page),
      limit: String(limit),
      ...(saleId   && { saleId }),
      ...(branchId && { branchId }),
    });
    const raw     = await api.get<any>(`/sales-returns?${params}`);
    const payload = raw?.data ?? raw;
    return {
      returns:  (payload.returns ?? []).map(normalizeSalesReturn),
      metadata: payload.metadata ?? {
        totalPages: 0, totalCount: 0, currentPage: 1,
        hasNextPage: false, hasPrevPage: false,
      },
      totals: { grandTotal: Number(payload.totals?.grandTotal ?? 0) },
    };
  });

export const getSalesReturnById = actionClient
  .inputSchema(getSalesReturnByIdSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.get<any>(`/sales-returns/${parsedInput.id}`);
    return normalizeSalesReturn(raw?.data ?? raw);
  });