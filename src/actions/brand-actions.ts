// src/actions/brand-actions.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import {
  brandSchema,
  updateBrandSchema,
  deleteBrandSchema,
  subBrandSchema,
  updateSubBrandSchema,
  deleteSubBrandSchema,
} from '@/schemas/brand-schema';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SubBrand = {
  id:          string;
  name:        string;
  description: string | null;
  brandId:     string;
  createdAt:   string;
  updatedAt:   string;
  brand?:      { id: string; name: string };
};

export type Brand = {
  id:          string;
  name:        string;
  description: string | null;
  createdAt:   string;
  updatedAt:   string;
  subBrands:   SubBrand[];
};

// ── Brand Actions ─────────────────────────────────────────────────────────────

export const createBrand = actionClient
  .inputSchema(brandSchema)
  .action(async ({ parsedInput }) => {
    try {
      const brand = await api.post<Brand>('/brands', parsedInput);
      revalidatePath('/brands');
      return brand;
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateBrand = actionClient
  .inputSchema(updateBrandSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      const brand = await api.patch<Brand>(`/brands/${id}`, data);
      revalidatePath('/brands');
      return brand;
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteBrand = actionClient
  .inputSchema(deleteBrandSchema)
  .action(async ({ parsedInput }) => {
    try {
      const brand = await api.delete<Brand>(`/brands/${parsedInput.id}`);
      revalidatePath('/brands');
      return brand;
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getBrandListForDropdown = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const brands = await api.get<Brand[]>('/brands?take=200');
    return brands.map((b) => ({ id: b.id, name: b.name }));
  } catch {
    return [];
  }
};

// ── SubBrand Actions ──────────────────────────────────────────────────────────

export const createSubBrand = actionClient
  .inputSchema(subBrandSchema)
  .action(async ({ parsedInput }) => {
    const { brandId, ...data } = parsedInput;
    try {
      const sb = await api.post<SubBrand>(`/brands/${brandId}/sub-brands`, data);
      revalidatePath('/brands');
      return sb;
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateSubBrand = actionClient
  .inputSchema(updateSubBrandSchema)
  .action(async ({ parsedInput }) => {
    const { id, brandId, ...data } = parsedInput;
    try {
      const sb = await api.patch<SubBrand>(`/brands/${brandId}/sub-brands/${id}`, data);
      revalidatePath('/brands');
      return sb;
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteSubBrand = actionClient
  .inputSchema(deleteSubBrandSchema)
  .action(async ({ parsedInput }) => {
    // We need brandId — pass it via the id field as "brandId:subBrandId"
    // Or better: deleteSubBrandSchema includes brandId
    try {
      const [brandId, subBrandId] = parsedInput.id.split('::');
      const sb = await api.delete<SubBrand>(`/brands/${brandId}/sub-brands/${subBrandId}`);
      revalidatePath('/brands');
      return sb;
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

  export const getSubBrandsByBrand = async (
  brandId: string,
): Promise<{ id: string; name: string }[]> => {
  try {
    const result = await api.get<{ data: SubBrand[] } | SubBrand[]>(
      `/brands/${brandId}/sub-brands?take=200`,
    );
    // Handle both { data: [...] } and plain array shapes
    const list = Array.isArray(result) ? result : (result as any).data ?? [];
    return list.map((s: SubBrand) => ({ id: s.id, name: s.name }));
  } catch {
    return [];
  }
};