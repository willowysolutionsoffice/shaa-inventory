import { z } from "zod";

export const purchaseSchema = z.object({
  supplierId:   z.string().min(1, "Supplier is required"),
  referenceNo:  z.string().min(1),
  branchId:     z.string().min(1, "Branch is required"),
  purchaseDate: z.coerce.date(),
  totalAmount:  z.coerce.number(),
  dueAmount:    z.coerce.number(),
  paidAmount:   z.coerce.number(),
});
// ← Remove purchaseUpdateSchema and getPurchaseByIdSchema from here entirely