import { z } from 'zod';

export const expenseCategorySchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const updateExpenseCategorySchema = expenseCategorySchema.partial().extend({
  id: z.string().min(1),
});