// src/app/(sidebar)/dashboard/page.tsx
// Single dashboard page — renders the full admin view OR the role-scoped
// staff view depending on the logged-in user's role.

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOptimizedDashboardData } from "@/lib/actions/optimized-dashboard";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMonthlyData } from "@/lib/actions/getMonthlyData";
import { getPermissionsForRole, PERMISSIONS } from "@/constants/permissions";
import type { Permission } from "@/constants/permissions";
import { getDashboardData } from "@/lib/actions/dashboard";
import { cookies } from "next/headers";
import { BranchPerformanceCard } from "@/components/dashboard/branch-performance-card";
import { BranchHeaderSelector } from "@/components/dashboard/branch-header-selector";
import { LiveDateTime } from "@/components/dashboard/live-date-time";
import { BrandSalesCard } from "@/components/dashboard/brand-sales-card";
import { getBranchListForDropdown, BranchDropdownItem } from "@/actions/branch-action";

import {
  IconUsers,
  IconPackage,
  IconCurrencyDollar,
  IconRefresh,
  IconStar,
  IconTrophy,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

// ─────────────────────────────────────────────────────────────────────────────
// Staff (non-admin) dashboard — permission-gated widgets
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:  "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    red:    "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    teal:   "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-lg shrink-0 ${colorMap[color] ?? colorMap.blue}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Types for StaffDashboard props ────────────────────────────────────────────

type StaffStats = {
  totalSaleAmount:           number;
  totalPurchaseAmount:       number;
  totalExpenseAmount:        number;
  totalOutstanding:          number;
  totalProducts:             number;
  lowStockItems:             number;
  totalCustomers:            number;
  totalSuppliers:            number;
};

type RecentSale = {
  id: string;
  invoiceNo: string;
  salesDate: string | Date;
  grandTotal: number;
  paymentStatus: string;
  paymentDue: number;
  customer: { name: string } | null;
};

type RecentPurchase = {
  id: string;
  purchaseNo: string;
  purchaseDate: string | Date;
  totalAmount: number;
  paymentStatus: string;
  paymentDue: number;
  supplier: { name: string } | null;
};

type RecentExpense = {
  id: string;
  title: string;
  amount: number;
  category: { name: string } | null;
};

type LowStockProduct = {
  id: string;
  productName: string;
  stock: number;
};

function StaffDashboard({
  userName,
  roleLabel,
  can,
  stats,
  recentSales,
  recentPurchases,
  recentExpenses,
  lowStock,
  brandPerformance = [],
}: {
  userName: string;
  roleLabel: string;
  can: (p: Permission) => boolean;
  stats: StaffStats;
  recentSales: RecentSale[];
  recentPurchases: RecentPurchase[];
  recentExpenses: RecentExpense[];
  lowStock: LowStockProduct[];
  brandPerformance?: any[];
}) {
  const {
    totalSaleAmount,
    totalPurchaseAmount,
    totalExpenseAmount,
    totalOutstanding,
    totalProducts,
    lowStockItems,
    totalCustomers,
    totalSuppliers,
  } = stats;

  const noWidgets =
    !can(PERMISSIONS.MANAGE_SALES) &&
    !can(PERMISSIONS.MANAGE_PURCHASES) &&
    !can(PERMISSIONS.MANAGE_EXPENSES) &&
    !can(PERMISSIONS.MANAGE_PRODUCTS);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-[#4F7DF3]/10 to-[#3B66D9]/05 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://shaacalicut.com/cdn/shop/files/ChatGPT_Image_Jul_12_2025_11_44_52_PM.png?height=100&v=1752344140"
              alt="SHAA"
              className="h-12 w-auto object-contain bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-border shadow-xs shrink-0"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Welcome back, {userName} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Logged in as{" "}
                <span className="font-medium text-[#4F7DF3]">{roleLabel}</span>
                {" · "}Shaa Calicut Enterprise
              </p>
            </div>
          </div>
          <LiveDateTime />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {can(PERMISSIONS.MANAGE_SALES) && (
          <StatCard
            title="Total Sales"
            value={`₹${totalSaleAmount.toLocaleString("en-IN")}`}
            sub={`${recentSales.length} recent invoices`}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            color="blue"
          />
        )}
        {can(PERMISSIONS.MANAGE_SALES) && totalOutstanding > 0 && (
          <StatCard
            title="Sales Outstanding"
            value={`₹${totalOutstanding.toLocaleString("en-IN")}`}
            sub="Pending collections"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="orange"
          />
        )}
        {can(PERMISSIONS.MANAGE_PURCHASES) && (
          <StatCard
            title="Total Purchases"
            value={`₹${totalPurchaseAmount.toLocaleString("en-IN")}`}
            sub={`${recentPurchases.length} recent orders`}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            color="teal"
          />
        )}
        {can(PERMISSIONS.MANAGE_EXPENSES) && (
          <StatCard
            title="Total Expenses"
            value={`₹${totalExpenseAmount.toLocaleString("en-IN")}`}
            sub={`${recentExpenses.length} recent entries`}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            color="purple"
          />
        )}
        {can(PERMISSIONS.MANAGE_PRODUCTS) && (
          <StatCard
            title="Products"
            value={totalProducts}
            sub={lowStockItems > 0 ? `${lowStockItems} low stock` : "All stocked"}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            color="green"
          />
        )}
        {can(PERMISSIONS.MANAGE_CUSTOMERS) && (
          <StatCard
            title="Customers"
            value={totalCustomers}
            sub="Registered"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            color="blue"
          />
        )}
        {can(PERMISSIONS.MANAGE_SUPPLIERS) && (
          <StatCard
            title="Suppliers"
            value={totalSuppliers}
            sub="Active partners"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            color="teal"
          />
        )}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {can(PERMISSIONS.MANAGE_SALES) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">RECENT SALES</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 5 invoices</p>
            </div>
            <div className="divide-y divide-border">
              {recentSales.map((sale) => (
                  <div key={sale.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sale.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">{sale.customer?.name ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{Number(sale.grandTotal).toLocaleString("en-IN")}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        sale.paymentStatus === "PAID" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {can(PERMISSIONS.MANAGE_PURCHASES) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">RECENT PURCHASES</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 4 purchase orders</p>
            </div>
            <div className="divide-y divide-border">
              {recentPurchases.map((pur) => (
                  <div key={pur.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pur.purchaseNo}</p>
                      <p className="text-xs text-muted-foreground">{pur.supplier?.name ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{Number(pur.totalAmount).toLocaleString("en-IN")}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        pur.paymentStatus === "PAID" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      }`}>
                        {pur.paymentStatus}
                      </span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {can(PERMISSIONS.MANAGE_EXPENSES) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">RECENT EXPENSES</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total: ₹{totalExpenseAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {recentExpenses.map((exp) => (
                  <div key={exp.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">{exp.category?.name ?? "—"}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">−₹{Number(exp.amount).toLocaleString("en-IN")}</p>
                  </div>
              ))}
            </div>
          </div>
        )}

        {can(PERMISSIONS.MANAGE_PRODUCTS) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">LOW STOCK ALERT</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Products with stock &lt; 15</p>
            </div>
            <div className="divide-y divide-border">
              {lowStock.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">All products well stocked.</p>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[220px]">{p.productName}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.stock <= 5 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
                    }`}>
                      {p.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {can(PERMISSIONS.MANAGE_SALES) && brandPerformance.length > 0 && (
        <BrandSalesCard brandPerf={brandPerformance} />
      )}

      {noWidgets && (
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-muted-foreground text-sm">
            No data widgets are configured for your role. Contact your administrator.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin dashboard
// ─────────────────────────────────────────────────────────────────────────────

// ── helpers used only inside AdminDashboard ───────────────────────────────────

function timeAgo(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr  < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

async function AdminDashboard({
  session,
  displayBranch,
  branchId,
  branches,
}: {
  session: any;
  displayBranch: string;
  branchId?: string;
  branches: BranchDropdownItem[];
}) {
  const [dashboardData, chartData] = await Promise.all([
    getOptimizedDashboardData(branchId),
    getMonthlyData(branchId),
  ]);

  const {
    totalCustomers = 0,
    totalProducts = 0,
    todaysSales = 0,
    todaysSalesCount = 0,
    todaysPurchases = 0,
    todaysPurchasesCount = 0,
    recentSales = [],
    topProducts = [],
    stockLevels = [],
    totalOutstanding = 0,
    outstandingCount = 0,
    branchPerformance = [],
    brandPerformance = [],
    pendingPOs = [],
    recentCustomers = [],
    recentPaidSales = [],
    salesGrowthPct = 0,
  } = dashboardData;

  const branchPerf = branchPerformance;
  const overallStatus = branchPerf.length === 0
    ? "No Data"
    : branchPerf.every((b: any) => b.pct >= 80)
    ? "Optimal"
    : branchPerf.some((b: any) => b.pct < 50)
    ? "Needs Attention"
    : "On Track";

  const lowStockProducts = (stockLevels || []).filter((p: any) => p.stock <= 10);

  // ── Synthesised notifications from live backend data ───────────────────────
  type Notif = { id: string; icon: "user" | "dollar" | "package"; color: string; title: string; body: string; time: string };
  const notifications: Notif[] = [
    ...recentCustomers.map((c: any) => ({
      id:    `cust-${c.id}`,
      icon:  "user" as const,
      color: "blue",
      title: "New Customer Registered",
      body:  `${c.name} was onboarded.`,
      time:  c.createdAt ? timeAgo(new Date(c.createdAt)) : "recently",
    })),
    ...recentPaidSales.map((s: any) => ({
      id:    `sale-${s.id}`,
      icon:  "dollar" as const,
      color: "green",
      title: "Large Payment Cleared",
      body:  `Invoice #${s.invoiceNo} fully paid (${formatCurrency(Number(s.grandTotal))}) via ${s.payments?.[0]?.paymentMethod ?? "card"}.`,
      time:  s.salesDate ? timeAgo(new Date(s.salesDate)) : "recently",
    })),
    ...lowStockProducts.slice(0, 3).map((p: any) => ({
      id:    `stock-${p.id}`,
      icon:  "package" as const,
      color: "red",
      title: "Low Stock Alert",
      body:  `${p.productName} has only ${p.stock} units left.`,
      time:  p.updatedAt ? timeAgo(new Date(p.updatedAt)) : "critical",
    })),
  ].slice(0, 5);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-border border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Branding & Welcome */}
          <div className="flex items-center gap-3.5">
            <img
              src="https://shaacalicut.com/cdn/shop/files/ChatGPT_Image_Jul_12_2025_11_44_52_PM.png?height=100&v=1752344140"
              alt="SHAA"
              className="h-11 w-auto object-contain bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-border shadow-xs shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-xl sm:text-2xl font-bold tracking-tight">
                  Welcome, {session.user.name || "User"}
                </h1>
                {displayBranch && (
                  <Badge variant="outline" className="text-xs font-semibold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                    {displayBranch.replace(/^ — /, "")}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                SHAA Calicut Enterprise Overview &amp; Real-Time Analytics
              </p>
            </div>
          </div>

          {/* Right Section: Date & Time in Right Corner + Quick Actions Toolbar */}
          <div className="flex flex-col items-start lg:items-end gap-2.5 shrink-0">
            {/* Top-Right Corner: Live Date and Time */}
            <div className="self-end">
              <LiveDateTime />
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
              <BranchHeaderSelector branches={branches} selectedBranchId={branchId} />
              <a
                href="/sales/pos"
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <IconCurrencyDollar className="h-4 w-4" /> POS Terminal
              </a>
              <a
                href="/purchase/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <IconPackage className="h-4 w-4" /> New PO
              </a>
              <a
                href="/admin/stock-adjustment"
                className="bg-card border border-border hover:bg-muted text-foreground px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <IconRefresh className="h-4 w-4" /> Sync Stock
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 p-4 md:p-6 gap-6">
        <div className="flex-1 space-y-6 md:space-y-8 min-w-0 w-full">

          {/* KPI Row - Balanced 3-card layout across all screen sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {/* Today's Revenue */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 p-4 sm:p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                <IconTrophy className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider mb-1">TODAY&apos;S REVENUES</h2>
                <div className="text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight">{formatCurrency(todaysSales)}</div>
                <p className="text-xs text-purple-200 mt-2">Across {todaysSalesCount} retail transactions</p>
              </div>
            </div>

            {/* Profile card */}
            <Card className="border-border shadow-md bg-card h-full flex flex-col justify-between">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-lg sm:text-xl font-bold text-white shadow-inner">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-yellow-500 border-2 border-card">
                      <IconStar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-foreground text-sm sm:text-base font-bold truncate">{session.user.name || "User"}</h4>
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{session.user.role || "USER"} ROLE</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-border pt-2.5">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-foreground">{totalCustomers}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Clients</p>
                  </div>
                  <div className="text-center border-l border-r border-border">
                    <p className="text-lg sm:text-xl font-bold text-foreground">{totalProducts}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-green-600">{todaysPurchasesCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">POs Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branch Performance & Switcher Card */}
            <BranchPerformanceCard
              branchPerf={branchPerf}
              overallStatus={overallStatus}
              branches={branches}
              selectedBranchId={branchId}
              className="col-span-1 md:col-span-2 lg:col-span-1 h-full"
            />
          </div>

          {/* Sales vs Purchases Interactive Area Chart */}
          <div className="w-full overflow-hidden rounded-xl shadow-sm border border-border">
            <ChartAreaInteractive data={chartData} />
          </div>

          {/* Brand-Wise Sales Performance */}
          <BrandSalesCard brandPerf={brandPerformance} />

          {/* Financial Summary */}
          <div>
            <div className="border-b border-border pb-2 mb-4">
              <h2 className="text-foreground text-base sm:text-lg font-bold uppercase tracking-wider">
                FINANCIAL RECORDS &amp; ACCRUALS
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time summary of today&apos;s sales, purchases, and outstanding receivables
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-green-500 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">TODAY&apos;S SALES</p>
                  <div className="text-2xl font-extrabold text-foreground mb-2">{formatCurrency(todaysSales)}</div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    salesGrowthPct >= 0 ? "text-green-600" : "text-red-500"
                  }`}>
                    {salesGrowthPct >= 0 ? (
                      <IconArrowUp className="h-3 w-3" />
                    ) : (
                      <IconArrowDown className="h-3 w-3" />
                    )}
                    {`${salesGrowthPct >= 0 ? "+" : ""}${salesGrowthPct}% vs yesterday`}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">TODAY&apos;S PURCHASES</p>
                  <div className="text-2xl font-extrabold text-foreground mb-2">{formatCurrency(todaysPurchases)}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                    <IconArrowUp className="h-3 w-3" /> {todaysPurchasesCount} POs processed
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">TOTAL OUTSTANDING (AR)</p>
                  <div className="text-2xl font-extrabold text-foreground mb-2">{formatCurrency(totalOutstanding || 0)}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <IconUsers className="h-3 w-3" /> From {outstandingCount} clients
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Products */}
          <div>
            <div className="border-b border-border pb-2 mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-foreground text-base sm:text-lg font-bold uppercase tracking-wider">
                  TOP MOVING PRODUCTS
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fastest moving inventory ranked by total quantity sold
                </p>
              </div>
              <a href="/admin/products" className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline">
                View catalog &rarr;
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 4).map((product, index) => (
                  <div key={product.productId} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-purple-300 transition-colors group">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">#{index + 1}</span>
                      <IconPackage className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="mb-3 font-bold text-sm line-clamp-2 h-10 text-foreground group-hover:text-purple-700 transition-colors">
                      {product.product?.productName ?? "Unknown"}
                    </div>
                    <div className="flex items-end justify-between border-t border-border pt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Stock</p>
                        <p className="text-xs font-bold">{product.product?.stock ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Sold Units</p>
                        <p className="text-xs font-bold text-emerald-600">{product._sum.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 py-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground text-sm font-medium">Insufficient sales data to rank products</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-72 2xl:w-80 flex flex-col gap-6 shrink-0">

          {/* Notifications */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3.5 px-4 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    LIVE NOTIFICATIONS
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Real-time alerts and activity updates
                  </p>
                </div>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-semibold bg-red-500 text-white rounded-full px-1.5 py-0.5">
                    {notifications.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">No recent activity</p>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 flex gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className={`mt-0.5 p-1.5 rounded-md h-fit shrink-0 ${
                        n.color === "blue"  ? "bg-blue-100 text-blue-600"   :
                        n.color === "green" ? "bg-green-100 text-green-600" :
                                              "bg-red-100 text-red-600"
                      }`}>
                        {n.icon === "user"    && <IconUsers className="h-3.5 w-3.5" />}
                        {n.icon === "dollar"  && <IconCurrencyDollar className="h-3.5 w-3.5" />}
                        {n.icon === "package" && <IconPackage className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending POs */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3.5 px-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                    PENDING POS
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Orders awaiting fulfillment or payment
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{pendingPOs.length} Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingPOs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">No pending purchase orders</p>
              ) : (
                <div className="divide-y divide-border">
                  {pendingPOs.map((po) => (
                    <div key={po.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold font-mono text-purple-600">{po.purchaseNo}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{po.supplier?.name ?? "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold">{formatCurrency(Number(po.totalAmount))}</p>
                        <p className={`text-[9px] font-semibold uppercase ${
                          po.paymentStatus === "PENDING" ? "text-orange-500" : "text-blue-500"
                        }`}>
                          {po.paymentStatus === "PARTIAL"
                            ? `Due ${formatCurrency(Number(po.paymentDue))}`
                            : "Unpaid"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 border-t border-border text-center">
                <a href="/purchase" className="text-xs text-muted-foreground hover:text-foreground font-medium">View all orders →</a>
              </div>
            </CardContent>
          </Card>

          {/* Latest Invoices */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3.5 px-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                    LATEST INVOICES
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Recent retail billing transactions
                  </p>
                </div>
                <a href="/sales" className="text-[10px] font-semibold text-purple-600 hover:underline">See Ledger →</a>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentSales.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted group-hover:bg-purple-100 transition-colors">
                        <IconCurrencyDollar className="h-4 w-4 text-muted-foreground group-hover:text-purple-600" />
                      </div>
                      <div>
                        <p className="text-foreground text-xs font-bold line-clamp-1">{sale.customer?.name ?? "—"}</p>
                        <p className="text-muted-foreground text-[10px]">{formatDate(sale.salesDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[8px] px-1 py-0 h-4 ${
                          sale.paymentStatus === "PAID"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : sale.paymentStatus === "PARTIAL"
                            ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                            : "border-red-200 text-red-700 bg-red-50"
                        }`}
                      >
                        {sale.paymentStatus === "PAID" ? "Cleared" : sale.paymentStatus === "PARTIAL" ? "Partial" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentSales.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">No recent transactions recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card className="border-border shadow-sm bg-card border-t-4 border-t-red-500">
            <CardHeader className="py-3.5 px-4 border-b border-border">
              <div>
                <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <IconArrowDown className="h-4 w-4" /> LOW STOCK ALERTS
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Items below minimum stock threshold
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stockLevels.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 text-red-600 p-1.5 rounded-md"><IconPackage className="h-3 w-3" /></div>
                      <p className="text-foreground text-xs font-semibold line-clamp-1 pr-2">{product.productName}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{product.stock} left</Badge>
                  </div>
                ))}
                {stockLevels.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">All stock levels healthy!</p>
                )}
              </div>
              {stockLevels.length > 5 && (
                <div className="p-3 border-t border-border text-center bg-muted/10">
                  <a href="/reports/stock-reports" className="text-xs font-semibold text-red-600 hover:underline">
                    View {stockLevels.length} critical items
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page entry point
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage(props: {
  searchParams?: Promise<{ branchId?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const selectedBranchId = searchParams?.branchId;

  const [session, branches] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getBranchListForDropdown(),
  ]);

  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const mockRole = process.env.NODE_ENV === "development"
    ? cookieStore.get("shaa_mock_role")?.value
    : undefined;

  const MOCK_NAMES: Record<string, string> = {
    admin:            "Arjun Menon",
    store_manager:    "Faisal Ibrahim",
    purchase_manager: "Suresh Nair",
    billing_staff:    "Reshma Abdul Razak",
    accountant:       "Priya Krishnan",
    user:             "Demo Staff",
  };

  const role     = (mockRole ?? session.user.role ?? "user").toLowerCase();
  const userName = (mockRole ? MOCK_NAMES[role] : session.user.name) ?? "User";
  const isAdmin  = role === "admin";

  let branchName: string | undefined;
  const currentBranchId = selectedBranchId || (!isAdmin ? session.user.branchId : undefined);
  if (currentBranchId) {
    const matched = branches.find((b) => b.id === currentBranchId);
    branchName = matched?.name;
  }
  const displayBranch = branchName ? ` — ${branchName}` : "";

  const roleLabels: Record<string, string> = {
    admin:            "Administrator",
    store_manager:    "Store Manager",
    purchase_manager: "Purchase Manager",
    billing_staff:    "Billing Staff",
    accountant:       "Accountant",
    user:             "Staff",
  };
  const roleLabel = roleLabels[role] ?? role;

  const userPermissions = getPermissionsForRole(role);
  const can = (p: Permission) => userPermissions.includes(p);

  if (isAdmin) {
    return (
      <AdminDashboard
        session={session}
        displayBranch={displayBranch}
        branchId={selectedBranchId}
        branches={branches}
      />
    );
  }

  // ── Staff: fetch real data scoped to the user's branch ──────────────────────
  const branchId = session.user.branchId as string | undefined;
  const staffDashboard = await getOptimizedDashboardData(branchId);
  const recentExpenses = (staffDashboard.recentExpenses ?? []).map((e: any) => ({
    ...e,
    amount: Number(e.amount),
  }));

  const staffStats = {
    totalSaleAmount:     staffDashboard.todaysSales,          // scoped totals via optimized
    totalPurchaseAmount: staffDashboard.todaysPurchases,
    totalExpenseAmount:  recentExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0),
    totalOutstanding:    staffDashboard.totalOutstanding,
    totalProducts:       staffDashboard.totalProducts,
    lowStockItems:       staffDashboard.lowStockItems,
    totalCustomers:      staffDashboard.totalCustomers,
    totalSuppliers:      staffDashboard.totalSuppliers,
  };

  return (
    <div className="p-4 md:p-6">
      <StaffDashboard
        userName={userName}
        roleLabel={roleLabel}
        can={can}
        stats={staffStats}
        recentSales={staffDashboard.recentSales as any}
        recentPurchases={staffDashboard.recentPurchases as any}
        recentExpenses={recentExpenses}
        lowStock={staffDashboard.stockLevels as any}
        brandPerformance={staffDashboard.brandPerformance ?? []}
      />
    </div>
  );
}