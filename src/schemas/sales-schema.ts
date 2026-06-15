import { z } from "zod";
 
export const SalePaymentStatusEnum = z.enum(["Due", "Paid", "Partial"]);
export const SalesStatusEnum       = z.enum(["Ordered", "Dispatched", "Cancelled"]);
 
export const salesSchema = z.object({
  invoiceNo:  z.string().optional().default(""),
  branchId:   z.string().min(1, "Branch is required"),
  salesdate:  z.coerce.date(),
  customerId: z.string().min(1, "Customer is required"),
  status:     SalesStatusEnum.default("Ordered"),
  grandTotal: z.coerce.number().min(0).optional().default(0),
  dueAmount:  z.coerce.number().optional().default(0),
  paidAmount: z.coerce.number().optional().default(0),
});
 
export const salesUpdateSchema = salesSchema.extend({
  id: z.string().min(1, "Sale ID is required"),
});
 
export const getSalesById = z.object({
  id: z.string().min(1),
});
 
 
// src/schemas/sale-payment-schema.ts
export const salePaymentSchema = z.object({
  amount:        z.coerce.number().min(0),
  paidOn:        z.coerce.date(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentNote:   z.string().nullable().optional(),
  dueDate:       z.coerce.date().nullable().optional(),
});
 
export const paymentUpdateSchema = salePaymentSchema.extend({
  id: z.string(),
});
 
export const getPaymentByIdSchema = z.object({
  id: z.string(),
});
 