'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

const stockUpdateSchema = z.object({
  id:    z.string().min(1),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),  // coerce first, then int check
});

export const updateProductStock = actionClient
  .inputSchema(stockUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, stock } = parsedInput;
    try {
      const product = await api.patch<any>(`/products/${id}`, { stock });
      revalidatePath('/admin/stock-adjustment');
      revalidatePath('/admin/products');
      return { data: product };
    } catch (error: any) {
      return { error: error.message ?? 'Failed to update stock' };
    }
  });