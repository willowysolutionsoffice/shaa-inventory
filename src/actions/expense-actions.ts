// src/actions/expense-actions.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Schemas ───────────────────────────────────────────────────────────────────

const expenseItemSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  amount:      z.coerce.number().min(0, 'Amount is required'),
  expenseDate: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  categoryId:  z.string().min(1, 'Category is required'),
  branchId:    z.string().min(1, 'Branch is required'),
});

const updateExpenseItemSchema = expenseItemSchema.partial().extend({
  id: z.string().min(1),
});

const getByIdSchema = z.object({ id: z.string().min(1) });

const listExpensesSchema = z.object({
  page:       z.number().default(1),
  limit:      z.number().default(10),
  from:       z.string().optional(),
  to:         z.string().optional(),
  branchId:   z.string().optional(),
  categoryId: z.string().optional(),
});

// ── Normalize ─────────────────────────────────────────────────────────────────

function normalizeExpense(e: any) {
  return {
    id:          e?.id          ?? '',
    title:       e?.title       ?? '',
    amount:      Number(e?.amount ?? 0),
    expenseDate: e?.expenseDate ?? null,
    description: e?.description ?? null,
    categoryId:  e?.categoryId  ?? '',
    branchId:    e?.branchId    ?? '',
    createdAt:   e?.createdAt   ?? null,
    updatedAt:   e?.updatedAt   ?? null,
    category:    e?.category    ?? null,
    branch:      e?.branch      ?? null,
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

export const createExpense = actionClient
  .inputSchema(expenseItemSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.post<any>('/expenses', parsedInput);
    revalidatePath('/expenses');
    return normalizeExpense(raw?.data ?? raw);
  });

export const getExpenseList = actionClient
  .inputSchema(listExpensesSchema)
  .action(async ({ parsedInput }) => {
    const { page, limit, from, to, branchId, categoryId } = parsedInput;
    const params = new URLSearchParams({
      page:  String(page),
      limit: String(limit),
      ...(from       && { from }),
      ...(to         && { to }),
      ...(branchId   && { branchId }),
      ...(categoryId && { categoryId }),
    });
    const raw     = await api.get<any>(`/expenses?${params}`);
    const payload = raw?.data ?? raw;
    return {
      expense:  (payload.expenses ?? []).map(normalizeExpense),
      metadata: payload.metadata ?? {
        totalPages: 0, totalCount: 0, currentPage: 1,
        hasNextPage: false, hasPrevPage: false,
      },
      totals: { amount: Number(payload.totals?.amount ?? 0) },
    };
  });

export const getExpenseById = actionClient
  .inputSchema(getByIdSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.get<any>(`/expenses/${parsedInput.id}`);
    return normalizeExpense(raw?.data ?? raw);
  });

export const updateExpense = actionClient
  .inputSchema(updateExpenseItemSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const raw = await api.patch<any>(`/expenses/${id}`, data);
    revalidatePath('/expenses');
    return normalizeExpense(raw?.data ?? raw);
  });

export const deleteExpense = actionClient
  .inputSchema(getByIdSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.delete<any>(`/expenses/${parsedInput.id}`);
    revalidatePath('/expenses');
    return normalizeExpense(raw?.data ?? raw);
  });