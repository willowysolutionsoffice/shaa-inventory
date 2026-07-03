import { z } from 'zod';

const refundMethodSchema = z.enum(['original', 'cash', 'credit']);

const returnItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
});

const exchangeItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
});

const extraPaymentSchema = z.object({
  amount: z.coerce.number().nonnegative(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'cheque', 'bank', 'bank_transfer', 'other']).default('cash'),
  paymentNote: z.string().optional().nullable(),
}).optional().nullable();

export const posRefundSchema = z.object({
  saleId: z.string().min(1),
  refundMethod: refundMethodSchema,
  reason: z.string().optional().nullable(),
  items: z.array(returnItemSchema).min(1, 'Select at least one returned product'),
  exchangeItems: z.array(exchangeItemSchema).optional().default([]),
  extraPayment: extraPaymentSchema,
});

export const createSalesReturnSchema = posRefundSchema;

export const updateSalesReturnSchema = z.object({
  id: z.string().min(1),
  refundMethod: refundMethodSchema.optional(),
  reason: z.string().optional().nullable(),
  items: z.array(returnItemSchema).optional(),
  exchangeItems: z.array(exchangeItemSchema).optional(),
  extraPayment: extraPaymentSchema,
});

export const listSalesReturnsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  saleId: z.string().optional(),
  branchId: z.string().optional(),
});

export const getSalesReturnByIdSchema = z.object({
  id: z.string().min(1),
});
