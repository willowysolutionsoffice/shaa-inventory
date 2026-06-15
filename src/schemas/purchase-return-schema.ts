import { z } from 'zod';

export const purchaseReturnSchema = z.object({
  referenceNo: z.string().optional(),   // ← make optional, backend generates returnNo
  branchId:    z.string().min(1, 'Branch is required'),
  supplierId:  z.string().min(1, 'Supplier is required'),
  purchaseId:  z.string().optional(),
  returnDate:  z.coerce.date(),
  totalAmount: z.coerce.number().min(0),
});