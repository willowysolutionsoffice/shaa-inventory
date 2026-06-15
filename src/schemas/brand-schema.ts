// src/schemas/brand-schema.ts
import { z } from 'zod';

export const brandSchema = z.object({
  name:        z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
});

export const updateBrandSchema = z.object({
  id:          z.string().min(1),
  name:        z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
});

export const deleteBrandSchema = z.object({
  id: z.string().min(1),
});

export const subBrandSchema = z.object({
  name:        z.string().min(1, 'Sub-brand name is required'),
  description: z.string().optional(),
  brandId:     z.string().min(1, 'Parent brand is required'),
});

export const updateSubBrandSchema = z.object({
  id:          z.string().min(1),
  name:        z.string().min(1, 'Sub-brand name is required'),
  description: z.string().optional(),
  brandId:     z.string().min(1),
});

export const deleteSubBrandSchema = z.object({
  id: z.string().min(1),
});

export type BrandSchema       = z.infer<typeof brandSchema>;
export type UpdateBrandSchema = z.infer<typeof updateBrandSchema>;
export type SubBrandSchema    = z.infer<typeof subBrandSchema>;