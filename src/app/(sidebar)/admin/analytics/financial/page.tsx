// src/app/(sidebar)/admin/analytics/financial/page.tsx
import { db } from "@/lib/mock-db";
import { FinancialAnalyticsClient } from "@/components/analytics/financial-analytics-client";

export const dynamic = "force-dynamic";

export default async function FinancialAnalyticsPage() {
  // ── Revenue ────────────────────────────────────────────────────────────────
  const totalRevenue = db.sales.reduce((s, x) => s + x.grandTotal, 0);
  const totalSalesDue = db.sales.reduce((s, x) => s + x.paymentDue, 0);
  const totalSalesReturn = db.salesReturns.reduce((s, r) => s + r.grandTotal, 0);
  const netRevenue = totalRevenue - totalSalesReturn;

  // ── Purchases ──────────────────────────────────────────────────────────────
  const totalPurchases = db.purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalPurchaseDue = db.purchases.reduce((s, p) => s + p.paymentDue, 0);
  const totalPurchaseReturn = db.purchaseReturns.reduce(
    (s, r) => s + r.totalAmount,
    0
  );

  // ── Expenses ───────────────────────────────────────────────────────────────
  const totalExpenses = db.expenses.reduce((s, e) => s + e.amount, 0);

  // per-category expenses
  const expenseByCategory = db.categories.map((cat) => {
    const total = db.expenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((s, e) => s + e.amount, 0);
    return { name: cat.name, total };
  }).filter((c) => c.total > 0);

  // ── P&L ────────────────────────────────────────────────────────────────────
  const grossProfit =
    netRevenue - (totalPurchases - totalPurchaseReturn);
  const netProfit = grossProfit - totalExpenses;

  // ── Supplier dues ──────────────────────────────────────────────────────────
  const supplierDues = db.purchases
    .filter((p) => p.paymentDue > 0)
    .map((p) => ({
      name:
        db.suppliers.find((s) => s.id === p.supplierId)?.name ?? "Unknown",
      due: p.paymentDue,
      purchaseNo: p.purchaseNo,
      status: p.paymentStatus,
    }));

  // ── Collection rate ────────────────────────────────────────────────────────
  const salesCollected = totalRevenue - totalSalesDue;
  const salesCollectionPct =
    totalRevenue > 0 ? Math.round((salesCollected / totalRevenue) * 100) : 0;
  const purchasesPaid = totalPurchases - totalPurchaseDue;
  const purchasePaymentPct =
    totalPurchases > 0
      ? Math.round((purchasesPaid / totalPurchases) * 100)
      : 0;

  // ── Monthly revenue vs purchases (last 6 months) ──────────────────────────
  const now = new Date();
  const monthLabels: string[] = [];
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(
      d.toLocaleString("en-IN", { month: "short", year: "2-digit" })
    );
    monthKeys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const monthlyRevenue = monthKeys.map((mk) =>
    db.sales
      .filter(
        (s) =>
          `${new Date(s.salesdate).getFullYear()}-${String(
            new Date(s.salesdate).getMonth() + 1
          ).padStart(2, "0")}` === mk
      )
      .reduce((sum, s) => sum + s.grandTotal, 0)
  );

  const monthlyPurchases = monthKeys.map((mk) =>
    db.purchases
      .filter(
        (p) =>
          `${new Date(p.purchaseDate).getFullYear()}-${String(
            new Date(p.purchaseDate).getMonth() + 1
          ).padStart(2, "0")}` === mk
      )
      .reduce((sum, p) => sum + p.totalAmount, 0)
  );

  const monthlyExpenses = monthKeys.map((mk) =>
    db.expenses
      .filter(
        (e) =>
          `${new Date(e.expenseDate).getFullYear()}-${String(
            new Date(e.expenseDate).getMonth() + 1
          ).padStart(2, "0")}` === mk
      )
      .reduce((sum, e) => sum + e.amount, 0)
  );

  const props = {
    pnl: {
      totalRevenue,
      totalSalesReturn,
      netRevenue,
      totalPurchases,
      totalPurchaseReturn,
      grossProfit,
      totalExpenses,
      netProfit,
    },
    metrics: {
      totalRevenue,
      totalPurchases,
      totalExpenses,
      totalPurchaseDue,
    },
    expenseByCategory,
    supplierDues,
    collection: {
      salesCollected,
      totalSalesDue,
      salesCollectionPct,
      purchasesPaid,
      totalPurchaseDue,
      purchasePaymentPct,
    },
    monthly: {
      labels: monthLabels,
      revenue: monthlyRevenue,
      purchases: monthlyPurchases,
      expenses: monthlyExpenses,
    },
  };

  return <FinancialAnalyticsClient {...props} />;
}