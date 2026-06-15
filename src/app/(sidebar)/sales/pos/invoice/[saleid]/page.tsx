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

  // getSaleById returns { data: { data: sale } } via next-safe-action wrapper
  const sale = result?.data?.data;

  if (!sale) notFound();

  const items    = sale.items    ?? [];
  const payments = sale.payments ?? [];
  const customer = sale.customer ?? { name: "Walk-in Customer" };
  const branch   = sale.branch   ?? { name: "Branch Central" };

  const subtotal = items.reduce(
    (s: number, i: any) => s + toNum(i.quantity) * toNum(i.unitPrice), 0
  );
  const itemDiscountTotal = items.reduce((s: number, i: any) => s + toNum(i.discount), 0);
  const netAfterDiscount  = subtotal - itemDiscountTotal;
  const taxAmount         = (netAfterDiscount * 12) / 100;
  const amountPaid        = payments.reduce((s: number, p: any) => s + toNum(p.amount), 0);

  const invoice = {
    saleId:    sale.id,
    invoiceNo: sale.invoiceNo ?? "—",
    date:      sale.salesDate ?? sale.salesdate,   // backend returns salesDate (Prisma field)

    customer: {
      name:  customer.name  ?? "Walk-in Customer",
      phone: (customer as any).phone ?? "",
    },
    branch: {
      name:    branch.name    ?? "Branch Central",
      address: (branch as any).address ?? "Calicut, Kerala",
      phone:   (branch as any).phone   ?? "",
    },

    paymentMethod: payments[0]?.paymentMethod ?? "Cash",

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
    taxAmount,
    grandTotal:  toNum(sale.grandTotal),
    amountPaid,
    change:      Math.max(0, amountPaid - toNum(sale.grandTotal)),
  };

  return <POSInvoiceSystem invoice={invoice} />;
}