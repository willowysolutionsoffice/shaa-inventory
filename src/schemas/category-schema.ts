import { z } from 'zod';

export const categorySchema = z.object({
  name:        z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.string().min(1),
});

export const deleteCategorySchema = z.object({
  id: z.string().min(1),
});