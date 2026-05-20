import { z } from 'zod';

export const customerSchema = z.object({
  CustomerID:z.string().min(2),
  branchId: z.string().min(1, "Branch is required"),
  name: z.string().min(2),
  email: z.string().optional(),
  phone: z.string().optional(),
  openingBalance: z.coerce.number(),
  address: z.string().optional(),
  salesDue:z.coerce.number().optional(),
  salesReturnDue:z.coerce.number().optional()
});

export const updateCustomerSchema = customerSchema.extend({
  id: z.string(),
});

export const deleteCustomerSchema = z.object({
  id: z.string(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
