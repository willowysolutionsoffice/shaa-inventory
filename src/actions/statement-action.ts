// src/actions/statement-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { z } from "zod";

const statementSchema = z.object({
  id: z.string(),
  type: z.enum(["customer", "supplier"]),
});

export const getStatementData = actionClient
  .inputSchema(statementSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, type } = parsedInput;

      if (type === "customer") {
        const customer = db.customers.find((c) => c.id === id);
        if (!customer) return { error: "Customer not found" };

        const sales = db.sales.filter((s) => s.customerId === id);
        const returns = db.salesReturns.filter((r) => r.customerId === id);
        const balancePayments = db.balancePayments.filter((p) => p.customerId === id);

        const saleIds = new Set(sales.map((s) => s.id));
        const salesPayments = db.salesPayments.filter((p) => saleIds.has(p.saleId));

        const transactions = [
          ...sales.map((s) => ({
            date: s.salesdate,
            description: `Sale (Inv: ${s.invoiceNo})`,
            debit: s.grandTotal,
            credit: 0,
            id: s.id,
            type: "sale",
          })),
          ...returns.map((r) => ({
            date: r.returnDate,
            description: `Sales Return (Inv: ${r.returnNo})`,
            debit: 0,
            credit: r.grandTotal,
            id: r.id,
            type: "return",
          })),
          ...balancePayments.map((p) => ({
            date: p.paidOn,
            description: `Payment (Bal: ${p.paymentMethod})${p.paymentNote ? ` - ${p.paymentNote}` : ""}`,
            debit: 0,
            credit: p.amount,
            id: p.id,
            type: "payment",
          })),
          ...salesPayments.map((p) => {
            const sale = db.sales.find((s) => s.id === p.saleId);
            return {
              date: p.paidOn,
              description: `Payment (Inv: ${sale?.invoiceNo || "Unknown"})${p.paymentNote ? ` - ${p.paymentNote}` : ""}`,
              debit: 0,
              credit: p.amount,
              id: p.id,
              type: "payment",
            };
          }),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          name: customer.name,
          openingBalance: customer.openingBalance,
          transactions,
        };
      } else {
        const supplier = db.suppliers.find((s) => s.id === id);
        if (!supplier) return { error: "Supplier not found" };

        const purchases = db.purchases.filter((p) => p.supplierId === id);
        const returns = db.purchaseReturns.filter((r) => r.supplierId === id);
        const balancePayments = db.balancePayments.filter((p) => p.supplierId === id);

        const purchaseIds = new Set(purchases.map((p) => p.id));
        const purchasePayments = db.purchasePayments.filter((p) => purchaseIds.has(p.purchaseId));

        const transactions = [
          ...purchases.map((p) => ({
            date: p.purchaseDate,
            description: `Purchase (Ref: ${p.purchaseNo})`,
            debit: 0,
            credit: p.totalAmount,
            id: p.id,
            type: "purchase",
          })),
          ...returns.map((r) => ({
            date: r.returnDate,
            description: `Purchase Return (Ref: ${r.returnNo})`,
            debit: r.totalAmount,
            credit: 0,
            id: r.id,
            type: "return",
          })),
          ...balancePayments.map((p) => ({
            date: p.paidOn,
            description: `Payment (Bal: ${p.paymentMethod})${p.paymentNote ? ` - ${p.paymentNote}` : ""}`,
            debit: p.amount,
            credit: 0,
            id: p.id,
            type: "payment",
          })),
          ...purchasePayments.map((p) => {
            const purchase = db.purchases.find((pur) => pur.id === p.purchaseId);
            return {
              date: p.paidOn,
              description: `Payment (Ref: ${purchase?.purchaseNo || "Unknown"})${p.paymentNote ? ` - ${p.paymentNote}` : ""}`,
              debit: p.amount,
              credit: 0,
              id: p.id,
              type: "payment",
            };
          }),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          name: supplier.name,
          openingBalance: supplier.openingBalance,
          transactions,
        };
      }
    } catch (error) {
      console.error("Get Statement Data Error:", error);
      return { error: "Failed to fetch statement data" };
    }
  });
