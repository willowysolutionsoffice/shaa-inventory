import { z } from "zod";

export const balancePaymentSchema = z.object({
  amount: z.coerce.number(),
  paidOn: z.coerce.date(),
  method: z.string().min(1),
  note: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
}).refine((data) => data.customerId || data.supplierId, {
  message: "Either customerId or supplierId is required",
});

export const getBalancePaymentsSchema = z
  .object({
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
  })
  .refine((data) => data.customerId || data.supplierId, {
    message: "Must provide customerId or supplierId",
  });

export const deleteBalancePaymentSchema = z.object({
  id: z.string(),
});

