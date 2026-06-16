// src/schemas/customer-schema.ts
import { z } from 'zod';

export const customerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email').optional().or(z.literal('')),
  phone:    z.string().optional(),
  branchId: z.string().min(1, 'Branch is required'),
});

export const updateCustomerSchema = customerSchema.extend({
  id: z.string().min(1),
});

export const deleteCustomerSchema = z.object({
  id: z.string().min(1),
});

export type CustomerInput = z.infer<typeof customerSchema>;