'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

// ── Schemas ────────────────────────────────────────────────────────────────────

const createCouponSchema = z.object({
  code:         z.string().min(1, 'Coupon code is required'),
  description:  z.string().optional(),
  type:         z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value:        z.coerce.number().positive('Discount value must be greater than zero'),
  minCartValue: z.coerce.number().min(0).optional().default(0),
  startDate:    z.string().min(1, 'Start date is required'),
  endDate:      z.string().min(1, 'End date is required'),
  branchId:     z.string().min(1, 'Branch is required'),
});

const updateCouponSchema = z.object({
  id:           z.string().min(1),
  description:  z.string().optional(),
  value:        z.coerce.number().positive().optional(),
  minCartValue: z.coerce.number().min(0).optional(),
  startDate:    z.string().optional(),
  endDate:      z.string().optional(),
  status:       z.enum(['ACTIVE', 'DISABLED']).optional(),
});

const couponIdSchema = z.object({
  id: z.string().min(1),
});

const validateCouponSchema = z.object({
  code:      z.string().min(1, 'Coupon code is required'),
  cartTotal: z.coerce.number().min(0, 'Cart total must be non-negative'),
  branchId:  z.string().min(1, 'Branch is required'),
});

const redeemCouponSchema = z.object({
  id:     z.string().min(1),
  saleId: z.string().min(1, 'Sale ID is required'),
});

const listCouponSchema = z.object({
  page:     z.coerce.number().optional().default(1),
  limit:    z.coerce.number().optional().default(10),
  branchId: z.string().optional(),
  status:   z.enum(['ACTIVE', 'EXPIRED', 'DISABLED']).optional(),
  search:   z.string().optional(),
});

// ── Normalizer ─────────────────────────────────────────────────────────────────

function normalizeCoupon(v: any): any {
  return {
    ...v,
    value:        Number(v?.value),
    minCartValue: Number(v?.minCartValue),
    redemptionCount: v?.redemptions?.length ?? 0,
  };
}

// ── Actions ────────────────────────────────────────────────────────────────────

export const createCoupon = actionClient
  .inputSchema(createCouponSchema)
  .action(async ({ parsedInput }) => {
    try {
      const coupon = await api.post<any>('/coupons', parsedInput);
      revalidatePath('/admin/coupons');
      return { data: normalizeCoupon(coupon) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateCoupon = actionClient
  .inputSchema(updateCouponSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...rest } = parsedInput;
      const coupon = await api.patch<any>(`/coupons/${id}`, rest);
      revalidatePath('/admin/coupons');
      return { data: normalizeCoupon(coupon) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const disableCoupon = actionClient
  .inputSchema(couponIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const coupon = await api.post<any>(`/coupons/${parsedInput.id}/disable`, {});
      revalidatePath('/admin/coupons');
      return { data: normalizeCoupon(coupon) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteCoupon = actionClient
  .inputSchema(couponIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const coupon = await api.delete<any>(`/coupons/${parsedInput.id}`);
      revalidatePath('/admin/coupons');
      return { data: normalizeCoupon(coupon) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const validateCoupon = actionClient
  .inputSchema(validateCouponSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await api.post<any>('/coupons/validate', parsedInput);
      return { data: result };
    } catch (error: any) {
      return { error: error.message ?? 'Coupon validation failed' };
    }
  });

export const redeemCoupon = actionClient
  .inputSchema(redeemCouponSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, saleId } = parsedInput;
      const result = await api.post<any>(`/coupons/${id}/redeem`, { saleId });
      revalidatePath('/admin/coupons');
      return { data: result };
    } catch (error: any) {
      return { error: error.message ?? 'Redemption failed' };
    }
  });

export const getCouponById = actionClient
  .inputSchema(couponIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const coupon = await api.get<any>(`/coupons/${parsedInput.id}`);
      return { data: normalizeCoupon(coupon) };
    } catch (error: any) {
      return { error: error.message ?? 'Coupon not found' };
    }
  });

export const getCouponList = actionClient
  .inputSchema(listCouponSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { page, limit, branchId, status, search } = parsedInput;
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(branchId && { branchId }),
        ...(status   && { status }),
        ...(search   && { search }),
      });
      const payload = await api.get<any>(`/coupons?${params}`);
      if (payload?.coupons) {
        payload.coupons = payload.coupons.map(normalizeCoupon);
      }
      return { data: payload };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });