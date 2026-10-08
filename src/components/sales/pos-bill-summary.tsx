// src/components/sales/pos-bill-summary.tsx
"use client";

import React, { memo } from "react";
import { Percent, Tag, Sparkles, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface BillSummaryProps {
  couponCode: string;
  setCouponCode: (v: string) => void;
  couponDiscountPercent: number;
  appliedCoupon: string;
  applyCoupon: () => void;
  removeCoupon: () => void;
  manualDiscountPercent: number | "";
  setManualDiscountPercent: (v: number | "") => void;
  manualDiscountAmount: number | "";
  setManualDiscountAmount: (v: number | "") => void;
  clearManualDiscount: () => void;
  subtotal: number;
  itemDiscountTotal: number;
  couponDiscountAmount: number;
  manualPct: number;
  manualAmt: number;
  manualDiscountCalculated: number;
  totalDiscountAmount: number;
  grandTotal: number;
  couponInputRef?: React.RefObject<HTMLInputElement | null>;
  manualDiscountPercentRef?: React.RefObject<HTMLInputElement | null>;
  manualDiscountAmountRef?: React.RefObject<HTMLInputElement | null>;
  handleStepNavigation?: (
    e: React.KeyboardEvent,
    index: number,
    onEnterAction?: () => void,
  ) => void;
}

export const BillSummary = memo(function BillSummary({
  couponCode,
  setCouponCode,
  couponDiscountPercent,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  manualDiscountPercent,
  setManualDiscountPercent,
  manualDiscountAmount,
  setManualDiscountAmount,
  clearManualDiscount,
  subtotal,
  itemDiscountTotal,
  couponDiscountAmount,
  manualPct,
  manualAmt,
  manualDiscountCalculated,
  totalDiscountAmount,
  grandTotal,
  couponInputRef,
  manualDiscountPercentRef,
  manualDiscountAmountRef,
  handleStepNavigation,
}: BillSummaryProps) {
  return (
    <div className="space-y-1.5">
      {/* Coupon */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={couponInputRef}
            placeholder="Coupon code…"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={(e) =>
              handleStepNavigation?.(e, 8, () => {
                if (couponCode.trim()) applyCoupon();
              })
            }
            disabled={couponDiscountPercent > 0}
            className="pl-7 h-8 text-xs bg-card disabled:opacity-60"
          />
        </div>
        {couponDiscountPercent > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs text-red-500 border-red-200 hover:bg-red-50"
            onClick={removeCoupon}
          >
            Remove
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={applyCoupon}
          >
            Apply
          </Button>
        )}
      </div>

      {/* Manual discount */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Percent className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={manualDiscountPercentRef}
            type="number"
            min={0}
            max={100}
            step="0.01"
            placeholder="Instant discount %"
            value={manualDiscountPercent}
            onChange={(e) => {
              const v = e.target.value;
              setManualDiscountPercent(
                v === "" ? "" : Math.min(Math.max(Number(v), 0), 100),
              );
            }}
            onKeyDown={(e) => handleStepNavigation?.(e, 9)}
            className="pl-7 h-8 text-xs bg-card"
          />
        </div>
        <div className="relative flex-1">
          <IndianRupee className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={manualDiscountAmountRef}
            type="number"
            min={0}
            step="0.01"
            placeholder="Instant discount ₹"
            value={manualDiscountAmount}
            onChange={(e) => {
              const v = e.target.value;
              setManualDiscountAmount(v === "" ? "" : Math.max(Number(v), 0));
            }}
            onKeyDown={(e) => handleStepNavigation?.(e, 10)}
            className="pl-7 h-8 text-xs bg-card"
          />
        </div>
        {(manualPct > 0 || manualAmt > 0) && (
          <button
            type="button"
            onClick={clearManualDiscount}
            className="text-[10px] text-muted-foreground hover:text-destructive underline whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Price breakdown */}
      <div className="space-y-1 text-[11px] text-muted-foreground">
        <div className="flex justify-between">
          <span>Cart Total:</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(subtotal)}
          </span>
        </div>
        {itemDiscountTotal > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Item Discounts:
            </span>
            <span className="font-semibold">
              −{formatCurrency(itemDiscountTotal)}
            </span>
          </div>
        )}
        {couponDiscountPercent > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Coupon ({appliedCoupon} –{" "}
              {couponDiscountPercent}%):
            </span>
            <span className="font-semibold">
              −{formatCurrency(couponDiscountAmount)}
            </span>
          </div>
        )}
        {manualPct > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Instant Discount ({manualPct}%):
            </span>
            <span className="font-semibold">
              −{formatCurrency(manualDiscountCalculated)}
            </span>
          </div>
        )}
        {totalDiscountAmount > 0 && (
          <div className="flex justify-between text-green-700 font-medium border-t border-dashed border-green-200 pt-1">
            <span>Total Savings:</span>
            <span>−{formatCurrency(totalDiscountAmount)}</span>
          </div>
        )}
        <Separator className="my-1 bg-border" />
        <div className="flex justify-between text-sm font-extrabold text-purple-700 dark:text-purple-400">
          <span>Total Payable:</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
});
