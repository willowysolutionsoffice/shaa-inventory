'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

export type ProductVariant = {
  id:            string;
  productId:     string;
  sku:           string;
  variantName:   string;
  stock:         number;
  purchasePrice: number;
  sellingPrice:  number;
  attributes:    {
    variation: { id: string; name: string };
    value:     { id: string; value: string };
  }[];
  createdAt: string;
  updatedAt: string;
};

function normalizeVariant(v: any): ProductVariant {
  return {
    ...v,
    stock:         Number(v.stock),
    purchasePrice: Number(v.purchasePrice),
    sellingPrice:  Number(v.sellingPrice),
  };
}
const createVariantSchema = z.object({
  productId:     z.string().min(1),
  sku:           z.string().min(1),
  variantName:   z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice:  z.coerce.number().min(0),
  stock:         z.coerce.number().min(0).default(0),
  attributes: z.array(z.object({
    variationId: z.string().min(1),
    valueId:     z.string().min(1),
  })).min(1),
});

export const createVariant = actionClient
  .inputSchema(createVariantSchema)
  .action(async ({ parsedInput }) => {
    const { productId, ...rest } = parsedInput;
    try {
      const variant = await api.post<any>(`/products/${productId}/variants`, rest);
      revalidatePath('/admin/products');
      return { data: normalizeVariant(variant) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteVariant = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    try {
      await api.delete(`/variants/${parsedInput.id}`);
      revalidatePath('/admin/products');
      return { data: { success: true } };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });


const updateVariantSchema = z.object({
  id:            z.string().min(1),
  sku:           z.string().optional(),
  stock:         z.coerce.number().optional(),
  purchasePrice: z.coerce.number().optional(),
  sellingPrice:  z.coerce.number().optional(),
});

const adjustStockSchema = z.object({
  id:    z.string().min(1),
  stock: z.coerce.number().min(0),
});


export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const variants = await api.get<any[]>(`/products/${productId}/variants`);
    return (variants ?? []).map(normalizeVariant);
  } catch {
    return [];
  }
};

export const updateVariant = actionClient
  .inputSchema(updateVariantSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      const variant = await api.patch<any>(`/variants/${id}`, data);
      revalidatePath('/admin/products');
      revalidatePath('/admin/stock-adjustment');
      return { data: normalizeVariant(variant) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const adjustVariantStock = actionClient
  .inputSchema(adjustStockSchema)
  .action(async ({ parsedInput }) => {
    const { id, stock } = parsedInput;
    try {
      const variant = await api.patch<any>(`/variants/${id}/stock`, { stock });
      revalidatePath('/admin/stock-adjustment');
      revalidatePath('/admin/products');
      return { data: normalizeVariant(variant) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });