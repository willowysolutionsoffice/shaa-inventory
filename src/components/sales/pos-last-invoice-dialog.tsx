// src/components/sales/pos-last-invoice-dialog.tsx
"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { LastInvoiceSnapshot, methodLabel } from "./pos-types";

interface LastInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  lastInvoice: LastInvoiceSnapshot | null;
}

export const LastInvoiceDialog = memo(function LastInvoiceDialog({
  open,
  onClose,
  lastInvoice,
}: LastInvoiceDialogProps) {
  if (!open || !lastInvoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Invoice {lastInvoice.invoiceNo}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {lastInvoice.customerName || "Walk-in Customer"}
              {lastInvoice.customerPhone
                ? ` • ${lastInvoice.customerPhone}`
                : ""}
              {lastInvoice.salesmanName
                ? ` • Salesman: ${lastInvoice.salesmanName}`
                : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ×
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Product</th>
                  <th className="px-3 py-2 text-left font-semibold">SKU</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Rate</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((item, index) => (
                  <tr
                    key={`${item.sku}-${index}`}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2 font-medium text-foreground">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {item.sku || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{item.qty}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discounts
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(lastInvoice.subtotal)}
                  </span>
                </div>
                {lastInvoice.itemDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Item Discounts</span>
                    <span>-{formatCurrency(lastInvoice.itemDiscount)}</span>
                  </div>
                )}
                {lastInvoice.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Coupon{" "}
                      {lastInvoice.couponCode
                        ? `(${lastInvoice.couponCode})`
                        : ""}
                    </span>
                    <span>-{formatCurrency(lastInvoice.couponDiscount)}</span>
                  </div>
                )}
                {lastInvoice.manualDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Manual Discount</span>
                    <span>-{formatCurrency(lastInvoice.manualDiscount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-extrabold text-purple-700 dark:text-purple-400">
                  <span>Grand Total</span>
                  <span>{formatCurrency(lastInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payments
              </h3>
              <div className="space-y-1.5">
                {lastInvoice.payments.map((payment, index) => (
                  <div
                    key={`${payment.method}-${index}`}
                    className="flex justify-between"
                  >
                    <span>{methodLabel(payment.method)}</span>
                    <span className="font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
                {lastInvoice.change > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Change Returned</span>
                    <span>{formatCurrency(lastInvoice.change)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
});
