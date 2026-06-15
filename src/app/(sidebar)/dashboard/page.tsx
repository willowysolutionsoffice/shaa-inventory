// src/app/(sidebar)/dashboard/page.tsx
// Single dashboard page — renders the full admin view OR the role-scoped
// staff view depending on the logged-in user's role.
// Fixes: "two parallel pages that resolve to the same path" by eliminating
// the /(dashboard)/dashboard duplicate entirely.

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOptimizedDashboardData } from "@/lib/actions/optimized-dashboard";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import DashboardCharts from "@/components/graphs/sales-purchase-graph";
import { getMonthlyData } from "@/lib/actions/getMonthlyData";
import { getPermissionsForRole, PERMISSIONS } from "@/constants/permissions";
import type { Permission } from "@/constants/permissions";
import { db } from "@/lib/mock-db";
import { cookies } from "next/headers";

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
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function groupSalesByMonth(records: any[]) {
  const map = new Map<string, number>();
  records.forEach((r) => {
    const key = new Date(r.salesdate).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    map.set(key, (map.get(key) || 0) + (r._sum?.grandTotal || 0));
  });
  return Array.from(map.entries()).map(([month, value]) => ({ month, value }));
}

function groupPurchasesByMonth(records: any[]) {
  const map = new Map<string, number>();
  records.forEach((r) => {
    const key = new Date(r.purchaseDate).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    map.set(key, (map.get(key) || 0) + (r._sum?.totalAmount || 0));
  });
  return Array.from(map.entries()).map(([month, value]) => ({ month, value }));
}

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

function StaffDashboard({
  userName,
  roleLabel,
  can,
}: {
  userName: string;
  roleLabel: string;
  can: (p: Permission) => boolean;
}) {
  // Compute stats from mock-db
  const totalSalesAmount     = db.sales.reduce((s, x) => s + x.grandTotal, 0);
  const totalPurchasesAmount = db.purchases.reduce((s, x) => s + x.totalAmount, 0);
  const totalExpensesAmount  = db.expenses.reduce((s, x) => s + x.amount, 0);
  const totalDue             = db.sales.reduce((s, x) => s + x.paymentDue, 0);
  const totalPurchaseDue     = db.purchases.reduce((s, x) => s + x.paymentDue, 0);
  const totalProducts        = db.products.length;
  const lowStockCount        = db.products.filter((p) => p.stock < 15).length;
  const totalCustomers       = db.customers.length;
  const totalSuppliers       = db.suppliers.length;

  const recentSales     = db.sales.slice(-5).reverse();
  const recentPurchases = db.purchases.slice(-4).reverse();
  const recentExpenses  = db.expenses.slice(-4).reverse();
  const lowStock        = db.products.filter((p) => p.stock < 15).slice(0, 5);

  const noWidgets =
    !can(PERMISSIONS.MANAGE_SALES) &&
    !can(PERMISSIONS.MANAGE_PURCHASES) &&
    !can(PERMISSIONS.MANAGE_EXPENSES) &&
    !can(PERMISSIONS.MANAGE_PRODUCTS);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-[#4F7DF3]/10 to-[#3B66D9]/05 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Logged in as{" "}
              <span className="font-medium text-[#4F7DF3]">{roleLabel}</span>
              {" · "}Shaa Calicut
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {can(PERMISSIONS.MANAGE_SALES) && (
          <StatCard
            title="Total Sales"
            value={`₹${totalSalesAmount.toLocaleString("en-IN")}`}
            sub={`${db.sales.length} invoices`}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            color="blue"
          />
        )}
        {can(PERMISSIONS.MANAGE_SALES) && totalDue > 0 && (
          <StatCard
            title="Sales Due"
            value={`₹${totalDue.toLocaleString("en-IN")}`}
            sub="Pending collections"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="orange"
          />
        )}
        {can(PERMISSIONS.MANAGE_PURCHASES) && (
          <StatCard
            title="Total Purchases"
            value={`₹${totalPurchasesAmount.toLocaleString("en-IN")}`}
            sub={`${db.purchases.length} orders`}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            color="teal"
          />
        )}
        {can(PERMISSIONS.MANAGE_PURCHASES) && totalPurchaseDue > 0 && (
          <StatCard
            title="Purchase Due"
            value={`₹${totalPurchaseDue.toLocaleString("en-IN")}`}
            sub="Payable to suppliers"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
            color="red"
          />
        )}
        {can(PERMISSIONS.MANAGE_EXPENSES) && (
          <StatCard
            title="Total Expenses"
            value={`₹${totalExpensesAmount.toLocaleString("en-IN")}`}
            sub={`${db.expenses.length} entries`}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            color="purple"
          />
        )}
        {can(PERMISSIONS.MANAGE_PRODUCTS) && (
          <StatCard
            title="Products"
            value={totalProducts}
            sub={lowStockCount > 0 ? `${lowStockCount} low stock` : "All stocked"}
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
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Sales</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 5 invoices</p>
            </div>
            <div className="divide-y divide-border">
              {recentSales.map((sale) => {
                const customer = db.customers.find((c) => c.id === sale.customerId);
                return (
                  <div key={sale.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sale.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">{customer?.name ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{sale.grandTotal.toLocaleString("en-IN")}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        sale.paymentStatus === "paid" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {can(PERMISSIONS.MANAGE_PURCHASES) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Purchases</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 4 purchase orders</p>
            </div>
            <div className="divide-y divide-border">
              {recentPurchases.map((pur) => {
                const supplier = db.suppliers.find((s) => s.id === pur.supplierId);
                return (
                  <div key={pur.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pur.purchaseNo}</p>
                      <p className="text-xs text-muted-foreground">{supplier?.name ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{pur.totalAmount.toLocaleString("en-IN")}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        pur.paymentStatus === "paid" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      }`}>
                        {pur.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {can(PERMISSIONS.MANAGE_EXPENSES) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Recent Expenses</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total: ₹{db.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {recentExpenses.map((exp) => {
                const cat = db.categories.find((c) => c.id === exp.categoryId);
                return (
                  <div key={exp.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">{cat?.name ?? "—"}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">−₹{exp.amount.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {can(PERMISSIONS.MANAGE_PRODUCTS) && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Low Stock Alert</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Products with stock &lt; 15</p>
            </div>
            <div className="divide-y divide-border">
              {lowStock.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">All products well stocked.</p>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[220px]">{p.product_name}</p>
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
// Admin dashboard — full enterprise view (original document 1)
// ─────────────────────────────────────────────────────────────────────────────

async function AdminDashboard({
  session,
  displayBranch,
}: {
  session: any;
  displayBranch: string;
}) {
  const isAdmin = true;
  const branchFilter = undefined; // admin sees all branches

  const [dashboardData, chartData] = await Promise.all([
    getOptimizedDashboardData(branchFilter),
    getMonthlyData(),
  ]);

  const {
    totalCustomers,
    totalProducts,
    todaysSales,
    todaysSalesCount,
    todaysPurchases,
    todaysPurchasesCount,
    monthlySales,
    monthlyPurchases,
    recentSales,
    topProducts,
    stockLevels,
    totalOutstanding,
    outstandingCount,
  } = dashboardData;

  const salesData    = groupSalesByMonth(monthlySales);
  const purchaseData = groupPurchasesByMonth(monthlyPurchases);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-border border-b px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              Welcome, {session.user.name || "User"}
              {displayBranch}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Your enterprise dashboard overview and real-time alerts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/sales/pos" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-md">
            <IconCurrencyDollar className="h-4 w-4" /> POS Terminal
          </a>
          <a href="/purchase/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-md">
            <IconPackage className="h-4 w-4" /> New PO
          </a>
          <a href="/admin/stock-adjustment" className="bg-card border border-border hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <IconRefresh className="h-4 w-4" /> Sync Stock
          </a>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 p-4 md:p-6 gap-6">
        <div className="flex-1 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today's Revenue */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <IconTrophy className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-medium text-purple-100 uppercase tracking-wider mb-2">Today's Revenues</h2>
                <div className="text-4xl font-extrabold mb-1">{formatCurrency(todaysSales)}</div>
                <p className="text-sm text-purple-200">Across {todaysSalesCount} retail transactions</p>
              </div>
            </div>

            {/* Profile card */}
            <Card className="border-border shadow-md bg-card">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-2xl font-bold text-white shadow-inner">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 border-2 border-card">
                      <IconStar className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-foreground text-lg font-bold">{session.user.name || "User"}</h4>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{session.user.role || "USER"} ROLE</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Clients</p>
                  </div>
                  <div className="text-center border-l border-r border-border">
                    <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{todaysPurchasesCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">POs Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branch performance */}
            <Card className="border-border shadow-md bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-wider">Branch Performance</h3>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Optimal</Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">HQ Central Store</span>
                      <span className="font-bold text-emerald-600">92%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Downtown Outlet</span>
                      <span className="font-bold text-blue-600">76%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "76%" }}></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-2">Metrics based on weekly sales targets</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            <div className="w-full overflow-hidden rounded-xl shadow-sm border border-border">
              <ChartAreaInteractive data={chartData} />
            </div>
            <div className="w-full overflow-hidden rounded-xl shadow-sm border border-border">
              <DashboardCharts salesData={salesData} purchaseData={purchaseData} />
            </div>
          </div>

          {/* Financial Summary */}
          <div>
            <h2 className="text-foreground text-lg font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Financial Records & Accruals</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-green-500 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Today's Sales</p>
                  <div className="text-2xl font-extrabold text-foreground mb-2">{formatCurrency(todaysSales)}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                    <IconArrowUp className="h-3 w-3" /> +12.5% vs yesterday
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Today's Purchases</p>
                  <div className="text-2xl font-extrabold text-foreground mb-2">{formatCurrency(todaysPurchases)}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                    <IconArrowUp className="h-3 w-3" /> {todaysPurchasesCount} POs processed
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Outstanding (AR)</p>
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
            <h2 className="text-foreground text-lg font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex justify-between items-end">
              <span>Top Moving Products</span>
              <a href="/admin/products" className="text-xs text-purple-600 hover:underline">View catalog</a>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 4).map((product, index) => (
                  <div key={product.productId} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-purple-300 transition-colors group">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">#{index + 1}</span>
                      <IconPackage className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="mb-3 font-bold text-sm line-clamp-2 h-10 text-foreground group-hover:text-purple-700 transition-colors">
                      {product.product?.product_name || "Unknown"}
                    </div>
                    <div className="flex items-end justify-between border-t border-border pt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Stock</p>
                        <p className="text-xs font-bold">{product.product?.stock || 0}</p>
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
        <div className="w-full xl:w-96 flex flex-col gap-6">

          {/* Notifications */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-4 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Live Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="p-4 flex gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="mt-0.5 bg-blue-100 text-blue-600 p-1.5 rounded-md h-fit"><IconUsers className="h-3.5 w-3.5" /></div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">New B2B Account Registered</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Corporate client "TechVision Inc" was onboarded.</p>
                    <p className="text-[9px] text-muted-foreground mt-1">10 minutes ago</p>
                  </div>
                </div>
                <div className="p-4 flex gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="mt-0.5 bg-green-100 text-green-600 p-1.5 rounded-md h-fit"><IconCurrencyDollar className="h-3.5 w-3.5" /></div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Large Payment Cleared</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Invoice #INV-9022 fully paid ($4,500.00) via Bank Transfer.</p>
                    <p className="text-[9px] text-muted-foreground mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending POs */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Pending POs</CardTitle>
              <Badge variant="secondary" className="text-[10px]">3 Active</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-xs font-bold font-mono text-purple-600">PO-2026-88</p>
                    <p className="text-[10px] text-muted-foreground">Global Electronics Ltd</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">$1,250.00</p>
                    <p className="text-[9px] text-orange-500 font-semibold uppercase">Processing</p>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-xs font-bold font-mono text-purple-600">PO-2026-89</p>
                    <p className="text-[10px] text-muted-foreground">Office Supplies Co</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">$420.50</p>
                    <p className="text-[9px] text-blue-500 font-semibold uppercase">Dispatched</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-border text-center">
                <a href="/purchase" className="text-xs text-muted-foreground hover:text-foreground font-medium">View all orders →</a>
              </div>
            </CardContent>
          </Card>

          {/* Latest Invoices */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Latest Invoices</CardTitle>
              <a href="/sales" className="text-[10px] font-semibold text-purple-600 hover:underline">See Ledger</a>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted group-hover:bg-purple-100 transition-colors">
                        <IconCurrencyDollar className="h-4 w-4 text-muted-foreground group-hover:text-purple-600" />
                      </div>
                      <div>
                        <p className="text-foreground text-xs font-bold line-clamp-1">{sale.customer.name}</p>
                        <p className="text-muted-foreground text-[10px]">{formatDate(sale.salesdate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground text-xs font-bold">{formatCurrency(sale.grandTotal)}</p>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-green-200 text-green-700 bg-green-50">Cleared</Badge>
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
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                <IconArrowDown className="h-4 w-4" /> Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stockLevels.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 text-red-600 p-1.5 rounded-md"><IconPackage className="h-3 w-3" /></div>
                      <p className="text-foreground text-xs font-semibold line-clamp-1 pr-2">{product.product_name}</p>
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
// Page entry point — single route, branches by role
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

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
    const role = (mockRole ?? session.user.role ?? "user").toLowerCase();
const userName = (mockRole ? MOCK_NAMES[role] : session.user.name) ?? "User";
  const isAdmin   = role === "admin";
  

  // Branch display name for non-admins
  let branchName: string | undefined;
if (!isAdmin && session.user.branchId) {
    const branch = await prisma.branch.findUnique({
    where: { id: session.user.branchId },  // ← was session.user.branch
      select: { name: true },
    });
    branchName = branch?.name;
  }
  const displayBranch = branchName ? ` — ${branchName}` : "";

  // Role label for staff banner
  const roleLabels: Record<string, string> = {
    admin:            "Administrator",
    store_manager:    "Store Manager",
    purchase_manager: "Purchase Manager",
    billing_staff:    "Billing Staff",
    accountant:       "Accountant",
    user:             "Staff",
  };
  const roleLabel = roleLabels[role] ?? role;

  // Permission helper for staff dashboard
  const userPermissions = getPermissionsForRole(role);
  const can = (p: Permission) => userPermissions.includes(p);

  // Admins get the full enterprise dashboard; everyone else gets the
  // permission-scoped staff dashboard.
  if (isAdmin) {
    return <AdminDashboard session={session} displayBranch={displayBranch} />;
  }

  return (
    <div className="p-4 md:p-6">
      <StaffDashboard userName={userName} roleLabel={roleLabel} can={can} />
    </div>
  );
}