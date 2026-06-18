// src/actions/expense-category-action.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Schemas ───────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const updateCategorySchema = categorySchema.partial().extend({
  id: z.string().min(1),
});

const getByIdSchema = z.object({ id: z.string().min(1) });

// ── Normalize ─────────────────────────────────────────────────────────────────

function normalizeCategory(c: any) {
  return {
    id:          c?.id          ?? '',
    name:        c?.name        ?? '',
    description: c?.description ?? null,
    createdAt:   c?.createdAt   ?? null,
    updatedAt:   c?.updatedAt   ?? null,
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

export const createExpenseCategory = actionClient
  .inputSchema(categorySchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.post<any>('/expense-categories', parsedInput);
    revalidatePath('/expense-categories');
    return normalizeCategory(raw?.data ?? raw);
  });

export const getExpenseCategoryList = actionClient
  .inputSchema(z.object({
    page:  z.number().default(1),
    limit: z.number().default(10),
  }))
  .action(async ({ parsedInput }) => {
    const params = new URLSearchParams({
      page:  String(parsedInput.page),
      limit: String(parsedInput.limit),
    });
    const raw     = await api.get<any>(`/expense-categories?${params}`);
    const payload = raw?.data ?? raw;
    // backend returns flat array
    const list    = Array.isArray(payload) ? payload : (payload.data ?? []);
    return {
      categories: list.map(normalizeCategory),
      // backend doesn't paginate categories, compute locally
      metadata: {
        totalCount:  list.length,
        totalPages:  Math.ceil(list.length / parsedInput.limit),
        currentPage: parsedInput.page,
        hasNextPage: parsedInput.page < Math.ceil(list.length / parsedInput.limit),
        hasPrevPage: parsedInput.page > 1,
      },
    };
  });

export const getExpenseCategoryDropdown = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const raw  = await api.get<any>('/expense-categories');
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    return list.map((c: any) => ({ id: c.id, name: c.name }));
  } catch {
    return [];
  }
};

export const updateExpenseCategory = actionClient
  .inputSchema(updateCategorySchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const raw = await api.patch<any>(`/expense-categories/${id}`, data);
    revalidatePath('/expense-categories');
    return normalizeCategory(raw?.data ?? raw);
  });

export const deleteExpenseCategory = actionClient
  .inputSchema(getByIdSchema)
  .action(async ({ parsedInput }) => {
    const raw = await api.delete<any>(`/expense-categories/${parsedInput.id}`);
    revalidatePath('/expense-categories');
    return normalizeCategory(raw?.data ?? raw);
  });