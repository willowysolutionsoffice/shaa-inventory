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
    exchangeTotal:Number(r?.exchangeTotal ?? 0),
    balanceAmount:Number(r?.balanceAmount ?? 0),
    sale:         r?.sale        ?? null,
    customer:     r?.customer    ?? null,
    branch:       r?.branch      ?? null,
    items: (r?.items ?? []).map((i: any) => ({
      id:           i.id,
      productId:    i.productId,
      quantity:     Number(i.quantity ?? 0),
      unitPrice:    Number(i.unitPrice ?? 0),
      subtotal:     Number(i.subtotal ?? 0),
      total:        Number(i.total ?? 0),
      product:      i.product ?? null,
      product_name: i.product?.productName ?? i.product?.product_name ?? '',
    })),
  };
}

const PATHS = ['/sales-returns', '/sales-return', '/sales', '/sales/pos'];
const revalidateAll = () => PATHS.forEach(revalidatePath);

function buildPayload(parsedInput: any) {
  return {
    saleId: parsedInput.saleId,
    refundMethod: parsedInput.refundMethod,
    reason: parsedInput.reason ?? null,
    items: (parsedInput.items ?? []).map((i: any) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
    })),
    exchangeItems: (parsedInput.exchangeItems ?? []).map((i: any) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      unitPrice: i.unitPrice != null ? Number(i.unitPrice) : undefined,
      total: i.total != null ? Number(i.total) : undefined,
      purchasePrice: i.purchasePrice != null ? Number(i.purchasePrice) : undefined,
    })),
    extraPayment: parsedInput.extraPayment
      ? {
          amount: Number(parsedInput.extraPayment.amount ?? 0),
          paymentMethod: parsedInput.extraPayment.paymentMethod ?? 'cash',
          paymentNote: parsedInput.extraPayment.paymentNote ?? 'Exchange balance payment',
        }
      : null,
  };
}

export const posRefund = actionClient
  .inputSchema(posRefundSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.post<any>('/sales-returns', buildPayload(parsedInput));
    revalidateAll();
    return normalizeSalesReturn(raw?.data ?? raw);
  });

export const createSalesReturn = actionClient
  .inputSchema(createSalesReturnSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.post<any>('/sales-returns', buildPayload(parsedInput));
    revalidateAll();
    return normalizeSalesReturn(raw?.data ?? raw);
  });

export const updateSalesReturn = actionClient
  .inputSchema(updateSalesReturnSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...rest } = parsedInput;
    const raw = await api.patch<any>(`/sales-returns/${id}`, buildPayload(rest));
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
      page: String(page),
      limit: String(limit),
      ...(saleId && { saleId }),
      ...(branchId && { branchId }),
    });
    const raw = await api.get<any>(`/sales-returns?${params}`);
    const payload = raw?.data ?? raw;
    return {
      returns: (payload.returns ?? []).map(normalizeSalesReturn),
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
