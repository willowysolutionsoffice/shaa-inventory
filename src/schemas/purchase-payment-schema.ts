import z from "zod";

export const purchasePaymentSchema = z.object({
  amount: z.coerce.number(),
  paidOn: z.date(),
  paymentMethod: z.string().min(1),
  paymentNote: z.string().nullable().optional(),
  dueDate:z.coerce.date().nullable().optional(),
});

export const paymentUpdateSchema = purchasePaymentSchema.extend({
  id: z.string(),
});

export const getPaymentByIdSchema = z.object({
  id: z.string(),
});