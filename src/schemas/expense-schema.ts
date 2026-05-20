import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().min(1),
  branchId: z.string().min(1, "Branch is required"),
  description: z.string().optional(),
  amount: z.coerce.number({ required_error: "Amount is required" }).min(0),
  date: z.coerce.date(),
  expenseCategoryId: z.string().min(1),
});

export const updateExpenseSchema = expenseSchema.extend({
    id: z.string(),
})

export const getExpenseByList = z.object({
    id:z.string(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>;
