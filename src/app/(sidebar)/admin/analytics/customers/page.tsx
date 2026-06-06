// src/app/(sidebar)/admin/analytics/customers/page.tsx
import { db } from "@/lib/mock-db";
import { CustomerAnalyticsClient } from "@/components/analytics/customer-analytics-client";

export const dynamic = "force-dynamic";

export default async function CustomerAnalyticsPage() {
  // ── Raw data from mock-db ──────────────────────────────────────────────────
  const customers = db.customers;
  const sales = db.sales;
  const saleItems = db.saleItems;
  const salesPayments = db.salesPayments;
  const salesReturns = db.salesReturns;
  const balancePayments = db.balancePayments.filter((p) => p.customerId);

  // ── Per-customer spend ─────────────────────────────────────────────────────
  const customerStats = customers.map((c) => {
    const cSales = sales.filter((s) => s.customerId === c.id);
    const totalSpent = cSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalDue = cSales.reduce((sum, s) => sum + s.paymentDue, 0);
    const cReturns = salesReturns.filter((r) => r.customerId === c.id);
    const totalReturned = cReturns.reduce((sum, r) => sum + r.grandTotal, 0);
    const netSpent = totalSpent - totalReturned;
    // loyalty: 1 pt per ₹100 net
    const loyaltyPoints = Math.max(0, Math.floor(netSpent / 100));
    const loyaltyTier =
      loyaltyPoints >= 1000
        ? "Platinum"
        : loyaltyPoints >= 500
        ? "Gold"
        : loyaltyPoints >= 200
        ? "Silver"
        : "Bronze";

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      openingBalance: c.openingBalance,
      salesDue: c.salesDue,
      salesReturnDue: c.salesReturnDue,
      totalSpent,
      totalReturned,
      netSpent,
      loyaltyPoints,
      loyaltyTier,
      purchaseCount: cSales.length,
      totalDue,
    };
  });

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totalCustomers = customers.length;
  const totalRevenue = sales.reduce((s, x) => s + x.grandTotal, 0);
  const totalSalesDue = customers.reduce((s, c) => s + c.salesDue, 0);
  const avgLoyaltyPoints =
    totalCustomers > 0
      ? Math.round(
          customerStats.reduce((s, c) => s + c.loyaltyPoints, 0) /
            totalCustomers
        )
      : 0;

  // ── Tier distribution ─────────────────────────────────────────────────────
  const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  customerStats.forEach((c) => {
    tierCounts[c.loyaltyTier as keyof typeof tierCounts]++;
  });

  // ── Monthly sales per customer (last 6 months) ────────────────────────────
  const now = new Date();
  const monthLabels: string[] = [];
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(
      d.toLocaleString("en-IN", { month: "short", year: "2-digit" })
    );
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // top 4 customers by spend for chart
  const top4 = [...customerStats]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 4);

  const monthlyByCustomer = top4.map((c) => {
    const monthly = monthKeys.map((mk) => {
      return sales
        .filter(
          (s) =>
            s.customerId === c.id &&
            `${new Date(s.salesdate).getFullYear()}-${String(
              new Date(s.salesdate).getMonth() + 1
            ).padStart(2, "0")}` === mk
        )
        .reduce((sum, s) => sum + s.grandTotal, 0);
    });
    return { name: c.name.split(" ")[0], data: monthly };
  });

  // ── Purchase frequency buckets ────────────────────────────────────────────
  const once = customerStats.filter((c) => c.purchaseCount === 1).length;
  const twice = customerStats.filter((c) => c.purchaseCount === 2).length;
  const threeplus = customerStats.filter((c) => c.purchaseCount >= 3).length;

  // ── Top customers by spend ────────────────────────────────────────────────
  const topCustomers = [...customerStats]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      initials: c.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      totalSpent: c.totalSpent,
      purchaseCount: c.purchaseCount,
    }));

  const props = {
    metrics: {
      totalCustomers,
      totalRevenue,
      totalSalesDue,
      avgLoyaltyPoints,
    },
    tierCounts,
    customerStats: customerStats.map((c) => ({
      name: c.name,
      salesDue: c.salesDue,
    })),
    monthlyByCustomer,
    monthLabels,
    frequencyBuckets: { once, twice, threeplus },
    topCustomers,
  };

  return <CustomerAnalyticsClient {...props} />;
}