// src/actions/pos-refund-action.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const refundItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  qty:       z.coerce.number().int().positive('Quantity must be greater than zero'),
});

const posRefundSchema = z.object({
  saleId:       z.string().min(1, 'Sale ID is required'),
  refundMethod: z.enum(['original', 'cash', 'credit']),
  reason:       z.string().min(1, 'Reason for return is required'),
  items:        z.array(refundItemSchema).min(1, 'At least one item is required'),
});

function normalizeRefund(r: any) {
  return {
    id:           r?.id,
    returnNo:     r?.returnNo,
    returnDate:   r?.returnDate,
    saleId:       r?.saleId,
    refundMethod: String(r?.refundMethod ?? '').toLowerCase(),
    reason:       r?.reason ?? null,
    grandTotal:   Number(r?.grandTotal ?? 0),
    items: (r?.items ?? []).map((i: any) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      subtotal:  Number(i.subtotal),
      total:     Number(i.total),
    })),
  };
}

export const posRefund = actionClient
  .inputSchema(posRefundSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { saleId, refundMethod, reason, items } = parsedInput;

      const raw = await api.post<any>('/sales-returns', {
        saleId,
        refundMethod,
        reason,
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
      });

      const result = raw?.data ?? raw;

      revalidatePath('/sales');
      revalidatePath('/sales/pos');

      return { data: normalizeRefund(result) };
    } catch (error: any) {
      return { error: error.message ?? 'Refund failed. Please try again.' };
    }
  });