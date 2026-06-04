import { z } from "zod";

export const SalePaymentStatusEnum = z.enum(["Due", "Paid", "Partial"]);
export const SalesStatusEnum = z.enum(["Ordered", "Dispatched", "Cancelled"]);

export const salesSchema = z.object({
  invoiceNo: z.string().optional().default(""),   // server generates it
  branchId:  z.string().min(1, "Branch is required"),
  salesdate: z.coerce.date(),
  customerId: z.string().min(1),
  status: SalesStatusEnum.default("Ordered"),
  grandTotal: z.coerce.number().min(0).optional().default(0),  // server recalculates
  dueAmount:  z.coerce.number().optional().default(0),
  paidAmount: z.coerce.number().optional().default(0),
});

export const salesUpdateSchema = salesSchema.extend({
  id: z.string(),
});

export const getSalesById = z.object({
  id: z.string(),
});
