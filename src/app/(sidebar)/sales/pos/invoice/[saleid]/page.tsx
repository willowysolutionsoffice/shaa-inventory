// src/app/(sidebar)/sales/pos/invoice/[saleid]/page.tsx
export const dynamic = "force-dynamic";

import { getSaleById } from "@/actions/sales-action";
import { notFound } from "next/navigation";
import { POSInvoiceSystem } from "@/components/sales/pos-invoice-system";

const toNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

interface Props {
  params: Promise<{ saleid: string }>;
}

export default async function POSInvoicePage({ params }: Props) {
  const { saleid } = await params;

  const result = await getSaleById({ id: saleid });

  const sale = result?.data?.data;

  if (!sale) notFound();

  const items    = sale.items    ?? [];
  const payments = sale.payments ?? [];
  const customer = sale.customer ?? { name: "Select a Customer" };
  const branch   = sale.branch   ?? { name: "Branch Central" };

  const subtotal          = items.reduce((s: number, i: any) => s + toNum(i.quantity) * toNum(i.unitPrice), 0);
  const itemDiscountTotal = items.reduce((s: number, i: any) => s + toNum(i.discount), 0);
  const amountPaid        = payments.reduce((s: number, p: any) => s + toNum(p.amount), 0);

  // ── Map each SalesPayment row → InvoicePayment ────────────────────────────
  const invoicePayments = payments.map((p: any) => ({
    method: (p.paymentMethod ?? "cash").toLowerCase(),  // "CASH" → "cash"
    amount: toNum(p.amount),
  }));

  // Fallback: if no payments in DB yet, synthesise one from grandTotal
  const safePayments = invoicePayments.length > 0
    ? invoicePayments
    : [{ method: "cash", amount: toNum(sale.grandTotal) }];

  const invoice = {
    saleId:    sale.id,
    invoiceNo: sale.invoiceNo ?? "—",
    date:      sale.salesDate ?? sale.salesdate,

    customer: {
      name:  customer.name  ?? "Select a Customer",
      phone: (customer as any).phone ?? "",
    },
    branch: {
      name:    branch.name    ?? "Branch Central",
      address: (branch as any).address ?? "Calicut, Kerala",
      phone:   (branch as any).phone   ?? "",
    },

    // kept for backward compat — invoice system now uses `payments` array instead
    paymentMethod: safePayments.length > 1
      ? "Split"
      : safePayments[0].method,

    // ── THIS is what the invoice system actually renders ──────────────────
    payments: safePayments,

    items: items.map((item: any) => ({
      id:        item.id,
      productId: item.productId,
      name:      item.product?.productName ?? item.product?.product_name ?? "Unknown Product",
      sku:       item.product?.sku ?? "",
      qty:       toNum(item.quantity),
      unitPrice: toNum(item.unitPrice),
      discount:  toNum(item.discount),
      total:     toNum(item.total),
    })),

    subtotal,
    couponDiscount: 0,
    couponCode:     "",
    manualDiscount: itemDiscountTotal,
    taxRate:        12,
    taxAmount:      0,
    grandTotal:     toNum(sale.grandTotal),
    amountPaid,
    change:         Math.max(0, amountPaid - toNum(sale.grandTotal)),
  };

  return <POSInvoiceSystem invoice={invoice} />;
}