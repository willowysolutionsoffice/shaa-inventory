import { z } from "zod";

export const SalePaymentStatusEnum = z.enum(["Due", "Paid", "Partial"]);
export const SalesStatusEnum = z.enum(["Ordered", "Dispatched", "Cancelled"]);

export const salesSchema = z.object({
  invoiceNo: z.string().min(1),
  branchId: z.string().min(1, "Branch is required"),
  salesdate: z.coerce.date(),
  customerId: z.string().min(1),
  status: SalesStatusEnum.default("Ordered"),
  grandTotal: z.coerce.number().min(0),
  dueAmount: z.coerce.number(),
  paidAmount: z.coerce.number()
});

export const salesUpdateSchema = salesSchema.extend({
  id: z.string(),
});

export const getSalesById = z.object({
  id: z.string(),
});
