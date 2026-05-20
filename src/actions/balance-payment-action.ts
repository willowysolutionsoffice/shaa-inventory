// src/actions/balance-payment-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { balancePaymentSchema, getBalancePaymentsSchema, deleteBalancePaymentSchema } from "@/schemas/balance-payment-schema";
import { revalidatePath } from "next/cache";

export const createBalancePayment = actionClient
  .inputSchema(balancePaymentSchema)
  .action(async (values) => {
    try {
      const { paidOn, ...otherValues } = values.parsedInput;
      const paymentId = `bpay-${Date.now()}`;

      const payment = {
        id: paymentId,
        customerId: otherValues.customerId || undefined,
        supplierId: otherValues.supplierId || undefined,
        amount: otherValues.amount,
        paidOn: paidOn ? new Date(paidOn) : new Date(),
        paymentMethod: otherValues.paymentMethod,
        paymentNote: otherValues.paymentNote || null,
      };

      db.balancePayments.push(payment);

      const amount = payment.amount;

      // --- Supplier Payment Handling ---
      if (payment.supplierId) {
        const supplier = db.suppliers.find((s) => s.id === payment.supplierId);
        if (supplier) {
          supplier.purchaseDue = Math.max(0, (supplier.purchaseDue || 0) - amount);
        }

        const purchases = db.purchases
          .filter((p) => p.supplierId === payment.supplierId && p.paymentDue > 0)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        let purchaseRemaining = amount;

        for (const purchase of purchases) {
          if (purchaseRemaining <= 0) break;

          const deduction = Math.min(purchase.paymentDue, purchaseRemaining);
          purchase.paymentDue -= deduction;
          purchaseRemaining -= deduction;
        }

        revalidatePath("/suppliers");
      }

      // --- Customer Payment Handling ---
      if (payment.customerId) {
        const customer = db.customers.find((c) => c.id === payment.customerId);
        if (customer) {
          customer.salesDue = Math.max(0, (customer.salesDue || 0) - amount);
        }

        const sales = db.sales
          .filter((s) => s.customerId === payment.customerId && s.paymentDue > 0)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        let salesRemaining = amount;

        for (const sale of sales) {
          if (salesRemaining <= 0) break;

          const deduction = Math.min(sale.paymentDue, salesRemaining);
          sale.paymentDue -= deduction;
          salesRemaining -= deduction;
        }

        revalidatePath("/customers");
      }

      return { data: payment };
    } catch (error) {
      console.error("Create Balance Payment Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getBalancePayments = actionClient
  .inputSchema(getBalancePaymentsSchema)
  .action(async ({ parsedInput }) => {
    const { customerId, supplierId } = parsedInput;

    try {
      const payments = db.balancePayments.filter((p) => {
        if (customerId && p.customerId !== customerId) return false;
        if (supplierId && p.supplierId !== supplierId) return false;
        return true;
      });
      
      return { data: payments };
    } catch (error) {
      console.error("Get Balance Payments Error:", error);
      return { error: "Failed to fetch payments" };
    }
  });

export const deleteBalancePayment = actionClient
  .inputSchema(deleteBalancePaymentSchema)
  .action(async ({ parsedInput }) => {
    try {
      const idx = db.balancePayments.findIndex((p) => p.id === parsedInput.id);
      if (idx === -1) {
        return { error: "Payment not found" };
      }

      const payment = db.balancePayments[idx];
      const amount = payment.amount;

      // --- Supplier Payment Reversal ---
      if (payment.supplierId) {
        const supplier = db.suppliers.find((s) => s.id === payment.supplierId);
        if (supplier) {
          supplier.purchaseDue = (supplier.purchaseDue || 0) + amount;
        }

        const purchases = db.purchases
          .filter((p) => p.supplierId === payment.supplierId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        let amountToRestore = amount;

        for (const purchase of purchases) {
          if (amountToRestore <= 0) break;

          // In mock environment, we can just allocate back up to totalAmount
          const canRestore = purchase.totalAmount - purchase.paymentDue;
          const restoreAmount = Math.min(canRestore, amountToRestore);
          purchase.paymentDue += restoreAmount;
          amountToRestore -= restoreAmount;
        }

        revalidatePath("/suppliers");
      }

      // --- Customer Payment Reversal ---
      if (payment.customerId) {
        const customer = db.customers.find((c) => c.id === payment.customerId);
        if (customer) {
          customer.salesDue = (customer.salesDue || 0) + amount;
        }

        const sales = db.sales
          .filter((s) => s.customerId === payment.customerId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        let amountToRestore = amount;

        for (const sale of sales) {
          if (amountToRestore <= 0) break;

          const canRestore = sale.grandTotal - sale.paymentDue;
          const restoreAmount = Math.min(canRestore, amountToRestore);
          sale.paymentDue += restoreAmount;
          amountToRestore -= restoreAmount;
        }

        revalidatePath("/customers");
      }

      // Delete the payment
      db.balancePayments.splice(idx, 1);

      return { success: true };
    } catch (error) {
      console.error("Delete Balance Payment Error:", error);
      return { error: "Failed to delete payment" };
    }
  });
