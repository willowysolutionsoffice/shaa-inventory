import { z } from 'zod';

export const refundItemSchema = z.object({
  productId:    z.string().min(1, 'productId is required'),
  quantity:     z.coerce.number().int().positive('Quantity must be > 0'),
  product_name: z.string().optional(), // display only
  unitPrice:    z.coerce.number().optional(),
  subtotal:     z.coerce.number().optional(),
  total:        z.coerce.number().optional(),
});

export const createSalesReturnSchema = z.object({
  saleId:       z.string().min(1, 'Sale is required'),
  refundMethod: z.enum(['original', 'cash', 'credit']),
  reason:       z.string().optional(),
  items:        z.array(refundItemSchema).min(1, 'At least one item is required'),
});

export const updateSalesReturnSchema = z.object({
  id:           z.string().min(1),
  refundMethod: z.enum(['original', 'cash', 'credit']).optional(),
  reason:       z.string().optional(),
  items:        z.array(refundItemSchema).min(1).optional(),
});

export const posRefundSchema = createSalesReturnSchema.extend({
  reason: z.string().min(1, 'Reason is required'),
});

export const listSalesReturnsSchema = z.object({
  page:     z.number().default(1),
  limit:    z.number().default(10),
  saleId:   z.string().optional(),
  branchId: z.string().optional(),
});

export const getSalesReturnByIdSchema = z.object({
  id: z.string().min(1),
});