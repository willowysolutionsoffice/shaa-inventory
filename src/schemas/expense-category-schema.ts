import { z } from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const updateExpenseCategorySchema = expenseCategorySchema.extend({
  id: z.string().min(1),
});

export const deleteExpenseCategorySchema = z.object({
  id: z.string().min(1),
});

export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
