// balance-payment-action.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import {
  balancePaymentSchema,
  getBalancePaymentsSchema,
  deleteBalancePaymentSchema,
} from '@/schemas/balance-payment-schema';

function normalizePayment(p: any) {
  return {
    ...p,
    amount: Number(p.amount),
    method: p.method ?? p.paymentMethod,   // backend returns paymentMethod, frontend expects method
    note:   p.note  ?? p.paymentNote ?? null,
  };
}

export const createBalancePayment = actionClient
  .inputSchema(balancePaymentSchema)
  .action(async ({ parsedInput }) => {
    try {
      const METHOD_MAP: Record<string, string> = {
        cash: 'CASH',
        card: 'CARD',
        bank: 'BANK_TRANSFER',
      };

      const raw = await api.post<any>('/balance-payments', {
        supplierId:    parsedInput.supplierId,
        customerId:    parsedInput.customerId,
        amount:        parsedInput.amount,
        paidOn:        parsedInput.paidOn,
        paymentMethod: METHOD_MAP[parsedInput.method] ?? parsedInput.method.toUpperCase(),
        paymentNote:   parsedInput.note,
      });
      revalidatePath('/suppliers');
      revalidatePath('/customers');
      return { data: normalizePayment(raw?.data ?? raw) };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to create payment' };
    }
  });

export const getBalancePayments = actionClient
  .inputSchema(getBalancePaymentsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const params = new URLSearchParams();
      if (parsedInput.supplierId) params.set('supplierId', parsedInput.supplierId);
      if (parsedInput.customerId) params.set('customerId', parsedInput.customerId);

      const raw      = await api.get<any>(`/balance-payments?${params}`);
      const payments = raw?.data ?? raw;
      return {
        data: (Array.isArray(payments) ? payments : []).map(normalizePayment),
      };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to fetch payments' };
    }
  });

export const deleteBalancePayment = actionClient
  .inputSchema(deleteBalancePaymentSchema)
  .action(async ({ parsedInput }) => {
    try {
      await api.delete<any>(`/balance-payments/${parsedInput.id}`);
      revalidatePath('/suppliers');
      revalidatePath('/customers');
      return { success: true };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to delete payment' };
    }
  });