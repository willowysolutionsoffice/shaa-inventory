import { z } from 'zod';

export const supplierSchema = z.object({
  SupplierId:z.string().min(2),
  branchId: z.string().min(1, "Branch is required"),
  name: z.string().min(2, "Supplier name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  openingBalance: z.coerce.number(),
  address: z.string().optional(),
  purchaseDue:z.coerce.number().optional(),
  purchaseReturnDue:z.coerce.number().optional()
});

export const updateSupplierSchema = supplierSchema.extend({
  id: z.string(),
});

export const deleteSupplierSchema = z.object({
  id: z.string(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
