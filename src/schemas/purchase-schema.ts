import { z } from "zod";

export const purchaseStatusEnum = z.enum(["Purchase_Order", "Received", "Cancelled"]);

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  referenceNo:z.string().min(1),
  branchId: z.string().min(1, "Branch is required"),
  purchaseDate: z.coerce.date(),
  status: purchaseStatusEnum,
  totalAmount:z.coerce.number(),
  dueAmount:z.coerce.number(),
  paidAmount:z.coerce.number()
});

export const purchaseUpdateSchema = purchaseSchema.extend({
  id: z.string(),
});

export const getPurchaseByIdSchema = z.object({
  id: z.string(),
});
