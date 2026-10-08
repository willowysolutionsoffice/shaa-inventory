// src/components/sales/pos-payment-panel.tsx
"use client";

import React, { memo } from "react";
import {
  CreditCard,
  Wallet,
  IndianRupee,
  PauseCircle,
  Receipt,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PaymentEntry, WALK_IN_SENTINEL } from "./pos-types";

interface PaymentPanelProps {
  splitMode: boolean;
  toggleSplitMode: () => void;
  payments: PaymentEntry[];
  setSinglePaymentMethod: (method: "cash" | "card" | "upi") => void;
  updateSplitMethod: (idx: number, method: "cash" | "card" | "upi") => void;
  updateSplitAmount: (idx: number, raw: string) => void;
  totalPaid: number;
  grandTotal: number;
  paymentShortfall: number;
  cashChange: number;
  hasUnselectedSplitMethod: boolean;
  isCheckingOut: boolean;
  cartLength: number;
  selectedCustomer: string;
  walkInCustomerId: string | null;
  onHold: () => void;
  onCheckout: () => void;
  onResetCart: () => void;
  checkoutButtonRef?: React.RefObject<HTMLButtonElement | null>;
  handleStepNavigation?: (
    e: React.KeyboardEvent,
    index: number,
    onEnterAction?: () => void,
  ) => void;
}

export const PaymentPanel = memo(function PaymentPanel({
  splitMode,
  toggleSplitMode,
  payments,
  setSinglePaymentMethod,
  updateSplitMethod,
  updateSplitAmount,
  totalPaid,
  grandTotal,
  paymentShortfall,
  cashChange,
  hasUnselectedSplitMethod,
  isCheckingOut,
  cartLength,
  selectedCustomer,
  walkInCustomerId,
  onHold,
  onCheckout,
  onResetCart,
  checkoutButtonRef,
  handleStepNavigation,
}: PaymentPanelProps) {
  return (
    <div className="space-y-1.5">
      {/* Header + Split toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Payment
        </span>
        <button
          type="button"
          onClick={toggleSplitMode}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
            splitMode
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-card text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
          }`}
        >
          {splitMode ? "✓ Split ON" : "Split Payment"}
        </button>
      </div>

      {/* ── Single payment mode ── */}
      {!splitMode && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-2">
            {(["cash", "card", "upi"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setSinglePaymentMethod(method)}
                className={`flex flex-col items-center p-1.5 border rounded-lg gap-1 text-[11px] font-bold transition-all ${
                  payments[0]?.method === method
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {method === "cash" && <IndianRupee className="h-4 w-4" />}
                {method === "card" && <CreditCard className="h-4 w-4" />}
                {method === "upi" && <Wallet className="h-4 w-4" />}
                <span>
                  {method === "cash"
                    ? "Cash"
                    : method === "card"
                      ? "Card"
                      : "UPI"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Split payment mode ── */}
      {splitMode && (
        <div className="space-y-1.5">
          {payments.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Select
                value={
                  entry.method ||
                  (idx === 0 ? "upi" : idx === 1 ? "cash" : "card")
                }
                onValueChange={(method) =>
                  updateSplitMethod(idx, method as "cash" | "card" | "upi")
                }
              >
                <SelectTrigger className="h-8 w-[120px] shrink-0 border-border bg-card text-xs">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <IndianRupee className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  placeholder={idx === 1 ? "Cash amount" : "Amount"}
                  value={entry.amount}
                  onChange={(e) => updateSplitAmount(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      checkoutButtonRef?.current?.focus();
                    }
                  }}
                  className="pl-6 h-8 w-full text-xs bg-card"
                />
              </div>
            </div>
          ))}

          {hasUnselectedSplitMethod && (
            <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
              Select a payment method for the remaining amount.
            </p>
          )}

          {/* Split summary */}
          <div className="rounded-md border border-border bg-muted/20 px-2.5 py-1.5 space-y-0.5 text-[11px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Total entered:</span>
              <span
                className={`font-bold ${
                  totalPaid >= grandTotal
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {formatCurrency(totalPaid)}
              </span>
            </div>
            {paymentShortfall > 0.009 && (
              <div className="flex justify-between text-red-500 font-semibold">
                <span>Still needed:</span>
                <span>{formatCurrency(paymentShortfall)}</span>
              </div>
            )}
            {cashChange > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Change to return:</span>
                <span>{formatCurrency(cashChange)}</span>
              </div>
            )}
            {totalPaid >= grandTotal &&
              paymentShortfall <= 0.009 &&
              !hasUnselectedSplitMethod && (
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span>✓</span> Payment complete
                </div>
              )}
          </div>
        </div>
      )}

      {/* Hold + Checkout */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-1 h-9 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-950/20"
          onClick={onHold}
          disabled={isCheckingOut}
        >
          <PauseCircle className="h-4 w-4" /> Hold
        </Button>
        <Button
          ref={checkoutButtonRef}
          className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white gap-1 h-9 shadow-md shadow-purple-600/20 font-bold disabled:opacity-60"
          onClick={onCheckout}
          onKeyDown={(e) => handleStepNavigation?.(e, 11, onCheckout)}
          disabled={
            isCheckingOut ||
            cartLength === 0 ||
            (selectedCustomer === WALK_IN_SENTINEL && !walkInCustomerId) ||
            hasUnselectedSplitMethod
          }
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving & Printing…
            </>
          ) : (
            <>
              <Receipt className="h-4 w-4" /> Checkout & Print
            </>
          )}
        </Button>
      </div>

      <Button
        variant="ghost"
        className="w-full h-7 text-xs text-muted-foreground gap-1"
        onClick={onResetCart}
      >
        <Trash2 className="h-3.5 w-3.5" /> Clear Cart
      </Button>
    </div>
  );
});
