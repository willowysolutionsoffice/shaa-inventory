import { z } from 'zod';

export const expenseSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  amount:      z.coerce.number().min(0, 'Amount is required'),
  expenseDate: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  categoryId:  z.string().min(1, 'Category is required'),
  branchId:    z.string().min(1, 'Branch is required'),
});

export const updateExpenseSchema = expenseSchema.partial().extend({
  id: z.string().min(1),
});