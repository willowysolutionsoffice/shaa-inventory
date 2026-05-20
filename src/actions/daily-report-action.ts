// src/actions/daily-report-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { z } from "zod";

const dailyReportSchema = z.object({
  date: z.string(), // ISO Date string
});

export const getDailyFinancialSummary = actionClient
  .inputSchema(dailyReportSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { date } = parsedInput;
      
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

      // --- CUSTOMER SIDE ---
      const staticOpening = db.customers.reduce((sum, c) => sum + c.openingBalance, 0);

      const salesBefore = db.sales.filter((s) => s.salesdate < startOfDay);
      const totalSalesBefore = salesBefore.reduce((sum, s) => sum + s.grandTotal, 0);

      const salesPaymentsBefore = db.salesPayments.filter((p) => p.paidOn < startOfDay);
      const balancePaymentsBefore = db.balancePayments.filter((p) => p.customerId && p.paidOn < startOfDay);
      const totalReceiptsBefore = 
        salesPaymentsBefore.reduce((sum, p) => sum + p.amount, 0) +
        balancePaymentsBefore.reduce((sum, p) => sum + p.amount, 0);

      const dayOpeningDue = staticOpening + totalSalesBefore - totalReceiptsBefore;

      const salesToday = db.sales.filter((s) => s.salesdate >= startOfDay && s.salesdate <= endOfDay);
      const todaySales = salesToday.reduce((sum, s) => sum + s.grandTotal, 0);

      const salesPaymentsToday = db.salesPayments.filter((p) => p.paidOn >= startOfDay && p.paidOn <= endOfDay);
      const balancePaymentsToday = db.balancePayments.filter((p) => p.customerId && p.paidOn >= startOfDay && p.paidOn <= endOfDay);
      const todayReceipts =
        salesPaymentsToday.reduce((sum, p) => sum + p.amount, 0) +
        balancePaymentsToday.reduce((sum, p) => sum + p.amount, 0);

      const dayClosingDue = dayOpeningDue + todaySales - todayReceipts;

      // --- SUPPLIER SIDE ---
      const staticSupplierOpening = db.suppliers.reduce((sum, s) => sum + s.openingBalance, 0);

      const purchasesBefore = db.purchases.filter((p) => p.purchaseDate < startOfDay);
      const totalPurchasesBefore = purchasesBefore.reduce((sum, p) => sum + p.totalAmount, 0);

      const purchasePaymentsBefore = db.purchasePayments.filter((p) => p.paidOn < startOfDay);
      const supplierBalancePaymentsBefore = db.balancePayments.filter((p) => p.supplierId && p.paidOn < startOfDay);
      const totalPaymentsBefore =
        purchasePaymentsBefore.reduce((sum, p) => sum + p.amount, 0) +
        supplierBalancePaymentsBefore.reduce((sum, p) => sum + p.amount, 0);

      const daySupplierOpeningDue = staticSupplierOpening + totalPurchasesBefore - totalPaymentsBefore;

      const purchasesToday = db.purchases.filter((p) => p.purchaseDate >= startOfDay && p.purchaseDate <= endOfDay);
      const todayPurchases = purchasesToday.reduce((sum, p) => sum + p.totalAmount, 0);

      const purchasePaymentsToday = db.purchasePayments.filter((p) => p.paidOn >= startOfDay && p.paidOn <= endOfDay);
      const supplierBalancePaymentsToday = db.balancePayments.filter((p) => p.supplierId && p.paidOn >= startOfDay && p.paidOn <= endOfDay);
      const todayPayments =
        purchasePaymentsToday.reduce((sum, p) => sum + p.amount, 0) +
        supplierBalancePaymentsToday.reduce((sum, p) => sum + p.amount, 0);

      const daySupplierClosingDue = daySupplierOpeningDue + todayPurchases - todayPayments;

      // --- EXPENSES ---
      const expensesBefore = db.expenses.filter((e) => e.expenseDate < startOfDay);
      const totalExpensesBefore = expensesBefore.reduce((sum, e) => sum + e.amount, 0);

      const expensesToday = db.expenses.filter((e) => e.expenseDate >= startOfDay && e.expenseDate <= endOfDay);
      const todayExpenses = expensesToday.reduce((sum, e) => sum + e.amount, 0);

      // --- CASH RESERVE ---
      const openingCashReserve = totalReceiptsBefore - totalPaymentsBefore - totalExpensesBefore;
      const closingCashReserve = (totalReceiptsBefore + todayReceipts) - (totalPaymentsBefore + todayPayments) - (totalExpensesBefore + todayExpenses);

      // --- PROFIT CALCULATION ---
      const saleIdsToday = new Set(salesToday.map((s) => s.id));
      const salesItemsToday = db.saleItems.filter((item) => saleIdsToday.has(item.saleId));

      const todayProfit = salesItemsToday.reduce((acc, item) => {
        const cost = (item.purchasePrice || 0) * item.quantity;
        return acc + (item.total - cost);
      }, 0);

      return {
        customerSummary: {
          openingBalance: dayOpeningDue,
          sales: todaySales,
          receipts: todayReceipts,
          closingBalance: dayClosingDue,
        },
        supplierSummary: {
          openingBalance: daySupplierOpeningDue,
          purchases: todayPurchases,
          payments: todayPayments,
          closingBalance: daySupplierClosingDue,
        },
        expenseSummary: {
          todayExpenses,
        },
        financialSummary: {
          openingCashReserve,
          closingCashReserve,
          todayProfit,
        },
      };
    } catch (error) {
      console.error("Get Daily Financial Summary Error:", error);
      return { error: "Failed to fetch daily summary" };
    }
  });
