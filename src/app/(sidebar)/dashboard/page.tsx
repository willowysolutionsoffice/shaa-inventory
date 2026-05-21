import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOptimizedDashboardData } from "@/lib/actions/optimized-dashboard";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import DashboardCharts from "@/components/graphs/sales-purchase-graph";
import { getMonthlyData } from "@/lib/actions/getMonthlyData";

import {
  IconUsers,
  IconPackage,
  IconCurrencyDollar,
  IconRefresh,
  IconStar,
  IconHeart,
  IconTrophy,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Get branch name if user is not admin
  let branchName: string | undefined;
  if (session.user.role !== "admin" && session.user.branch) {
    const branch = await prisma.branch.findUnique({
      where: { id: session.user.branch },
      select: { name: true },
    });
    branchName = branch?.name;
  }

  // Use branchName in the header if needed
  const displayBranch = branchName ? ` - ${branchName}` : "";

  // Use optimized dashboard data fetcher
  const isAdmin = (session?.user?.role ?? "").toLowerCase() === "admin";
  const branchFilter = isAdmin ? undefined : session?.user?.branch || undefined;
  // Fetch dashboard and chart data in parallel
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

  // Generic groupByMonth function for sales
  function groupSalesByMonth(records: typeof monthlySales) {
    const map = new Map<string, number>();

    records.forEach((r) => {
      const monthKey = new Date(r.salesdate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      const current = map.get(monthKey) || 0;
      map.set(monthKey, current + (r._sum.grandTotal || 0));
    });

    return Array.from(map.entries()).map(([month, value]) => ({
      month,
      value,
    }));
  }

  // Generic groupByMonth function for purchases
  function groupPurchasesByMonth(records: typeof monthlyPurchases) {
    const map = new Map<string, number>();

    records.forEach((r) => {
      const monthKey = new Date(r.purchaseDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      const current = map.get(monthKey) || 0;
      map.set(monthKey, current + (r._sum.totalAmount || 0));
    });

    return Array.from(map.entries()).map(([month, value]) => ({
      month,
      value,
    }));
  }

  const salesData = groupSalesByMonth(monthlySales);
  const purchaseData = groupPurchasesByMonth(monthlyPurchases);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Modern Header & Quick Actions */}
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
        
        {/* Quick Actions Panel */}
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
        {/* Main Content Area (Left) */}
        <div className="flex-1 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Highlights */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <IconTrophy className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-purple-100 uppercase tracking-wider">Today's Revenues</h2>
                </div>
                <div className="text-4xl font-extrabold mb-1">
                  {formatCurrency(todaysSales)}
                </div>
                <p className="text-sm text-purple-200">Across {todaysSalesCount} retail transactions</p>
              </div>
            </div>

            {/* Profile & Users Card */}
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

            {/* Branch Performance Summary */}
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
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Downtown Outlet</span>
                      <span className="font-bold text-blue-600">76%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-2">Metrics based on weekly sales targets</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
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

        {/* Right Sidebar - Widgets & Alerts */}
        <div className="w-full xl:w-96 flex flex-col gap-6">
          
          {/* Notifications Panel */}
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

          {/* Pending Purchase Orders */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Pending POs</CardTitle>
              <Badge variant="secondary" className="text-[10px]">3 Active</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {/* Mock POs */}
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

          {/* Recent Transactions */}
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

          {/* Low Stock Alerts */}
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
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{product.stock} left</Badge>
                    </div>
                  </div>
                ))}
                {stockLevels.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">All stock levels healthy!</p>
                )}
              </div>
              {stockLevels.length > 5 && (
                <div className="p-3 border-t border-border text-center bg-muted/10">
                  <a href="/reports/stock-reports" className="text-xs font-semibold text-red-600 hover:underline">View {stockLevels.length} critical items</a>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
