'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { categorySchema, updateCategorySchema, deleteCategorySchema } from '@/schemas/category-schema';
import { z } from 'zod';

export type ProductCategory = {
  id:          string;
  name:        string;
  description: string | null;
  createdAt:   string;
  updatedAt:   string;
  _count:      { products: number };
};

export type CategoryDropdownItem = {
  id:   string;
  name: string;
};

export const createCategory = actionClient
  .inputSchema(categorySchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw      = await api.post<any>('/categories', parsedInput);
      const category = raw?.data ?? raw;   // ← unwrap
      revalidatePath('/admin/products/categories');
      return { data: category };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateCategory = actionClient
  .inputSchema(updateCategorySchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      const raw      = await api.patch<any>(`/categories/${id}`, data);
      const category = raw?.data ?? raw;   // ← unwrap
      revalidatePath('/admin/products/categories');
      return { data: category };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteCategory = actionClient
  .inputSchema(deleteCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      const raw      = await api.delete<any>(`/categories/${parsedInput.id}`);
      const category = raw?.data ?? raw;   // ← unwrap
      revalidatePath('/admin/products/categories');
      return { data: category };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getCategoryList = actionClient
  .inputSchema(z.object({
    search: z.string().optional(),
    skip:   z.coerce.number().optional().default(0),
    take:   z.coerce.number().optional().default(50),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const params = new URLSearchParams({
        skip: String(parsedInput.skip),
        take: String(parsedInput.take),
        ...(parsedInput.search && { search: parsedInput.search }),
      });
      const raw    = await api.get<any>(`/categories?${params}`);
      const result = raw?.data ?? raw;   // ← unwrap
      return { data: result };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getCategoryDropdown = async (): Promise<CategoryDropdownItem[]> => {
  try {
    return await api.get<CategoryDropdownItem[]>('/categories/dropdown');
  } catch {
    return [];
  }
};