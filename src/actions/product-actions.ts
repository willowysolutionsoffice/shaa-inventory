'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

const createProductSchema = z.object({
  product_name:  z.string().min(1, 'Product name is required'),
  sku:           z.string().min(1, 'SKU is required'),
  unit:          z.string().min(1, 'Unit is required'),
  stock:         z.coerce.number().default(0),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice:  z.coerce.number().min(0),
  brandId:       z.string().min(1, 'Brand is required'),
  subBrandId:    z.string().optional(),
  categoryId:    z.string().optional(),
  branchId:      z.string().min(1, 'Branch is required'),
  description:   z.string().optional(),
  hsl:           z.string().optional(),
  variationIds:  z.array(z.string()).optional().default([]),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().min(1),
});

const deleteProductSchema = z.object({
  id: z.string().min(1),
});

const getProductByIdSchema = z.object({
  id: z.string().min(1),
});

const getProductListSchema = z.object({
  page:       z.coerce.number().optional().default(1),
  limit:      z.coerce.number().optional().default(10),
  branchId:   z.string().optional(),
  brandId:    z.string().optional(),
  subBrandId: z.string().optional(),
  categoryId: z.string().optional(),
  search:     z.string().optional(),
});

function normalizeProduct(p: any): any {
  return {
    ...p,
    product_name:  p.productName ?? p.product_name ?? '',
    purchasePrice: Number(p.purchasePrice),
    sellingPrice:  Number(p.sellingPrice),
    stock:         Number(p.stock),
    hsl:           p.hsl        ?? null,
    category:      p.category   ?? null,
    // Derive categoryId from direct field or nested object
    categoryId:    p.categoryId ?? p.category?.id ?? null,
  };
}

export const createProduct = actionClient
  .inputSchema(createProductSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { product_name, subBrandId, categoryId, hsl, ...rest } = parsedInput;
      const product = await api.post<any>('/products', {
        productName: product_name,
        ...rest,
        hsl:        hsl        ? hsl        : undefined,
        subBrandId: subBrandId ? subBrandId : undefined,
        categoryId: categoryId ? categoryId : undefined,
      });
      revalidatePath('/admin/products');
      return { data: normalizeProduct(product) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateProduct = actionClient
  .inputSchema(updateProductSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, product_name, subBrandId, categoryId, hsl, ...rest } = parsedInput;
      const product = await api.patch<any>(`/products/${id}`, {
        ...(product_name ? { productName: product_name } : {}),
        ...rest,
        hsl:        hsl        ? hsl        : undefined,
        subBrandId: subBrandId ? subBrandId : undefined,
        categoryId: categoryId ? categoryId : undefined,
      });
      revalidatePath('/admin/products');
      return { data: normalizeProduct(product) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteProduct = actionClient
  .inputSchema(deleteProductSchema)
  .action(async ({ parsedInput }) => {
    try {
      const product = await api.delete<any>(`/products/${parsedInput.id}`);
      revalidatePath('/admin/products');
      return { data: product };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getProductById = actionClient
  .inputSchema(getProductByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const product = await api.get<any>(`/products/${parsedInput.id}`);
      return { data: normalizeProduct(product) };
    } catch (error: any) {
      return { error: error.message ?? 'Product not found' };
    }
  });

export const getProductList = actionClient
  .inputSchema(getProductListSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { page, limit, branchId, brandId, subBrandId, categoryId, search } = parsedInput;
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(branchId   && { branchId }),
        ...(brandId    && { brandId }),
        ...(subBrandId && { subBrandId }),
        ...(categoryId && { categoryId }),
        ...(search     && { search }),
      });
      const payload = await api.get<any>(`/products?${params}`);
      if (payload?.products) {
        payload.products = payload.products.map(normalizeProduct);
      }
      return { data: payload };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getProductDropdown = async (params?: { query?: string; branchId?: string }) => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.set('branchId', params.branchId);
    if (params?.query)    searchParams.set('search', params.query);

    const url = `/products/dropdown${searchParams.toString() ? `?${searchParams}` : ''}`;
    const products = await api.get<any[]>(url);
    return (products ?? []).map((p: any) => ({
      ...p,
      product_name:  p.productName ?? p.product_name ?? '',
      purchasePrice: Number(p.purchasePrice),
      sellingPrice:  Number(p.sellingPrice),
      stock:         Number(p.stock),
    }));
  } catch {
    return [];
  }
};

