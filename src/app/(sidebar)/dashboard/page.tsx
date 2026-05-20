import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOptimizedDashboardData } from "@/lib/actions/optimized-dashboard";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="bg-background min-h-screen">
      {/* Modern Header */}
      <div className="bg-card border-border border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <h1 className="text-foreground text-2xl font-bold">
                Welcome, {session.user.name || "User"}
                {displayBranch}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Your inventory dashboard overview
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
            {/* Inventory Balance Card - Prominent Display */}
            <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-purple-800 p-6 text-white md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Today&apos;s Sales</h2>
              </div>
              <div className="text-3xl font-bold md:text-4xl">
                {formatCurrency(todaysSales)}
              </div>
            </div>

            {/* Profile Card */}
            <Card className="border-border/50 dark:via-sidebar border bg-gradient-to-br from-indigo-50 via-white to-emerald-50 shadow-md dark:from-indigo-950/30 dark:to-emerald-950/30">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground text-lg font-semibold">
                    Profile
                  </h3>
                  <IconRefresh className="text-muted-foreground hover:text-foreground h-5 w-5 cursor-pointer" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-2xl font-bold text-white">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400">
                      <IconStar className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <h4 className="text-foreground text-lg font-semibold">
                    {session.user.name || "User"}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {session.user.role?.toUpperCase() || "USER"}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <IconUsers className="h-4 w-4" />
                      <span className="text-sm">{totalCustomers}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <IconHeart className="h-4 w-4" />
                      <span className="text-sm">{totalProducts}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <IconTrophy className="h-4 w-4" />
                      <span className="text-sm">{todaysSalesCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
              {/* Interactive Area Chart */}
              <div className="w-full overflow-hidden">
                <ChartAreaInteractive data={chartData} />
              </div>

              {/* Monthly Sales & Purchases Bar Chart */}
              <div className="w-full overflow-hidden">
                <DashboardCharts
                  salesData={salesData}
                  purchaseData={purchaseData}
                />
              </div>
            </div>

            {/* Financial Record */}

            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-foreground text-xl font-semibold">
                  Financial Record
                </h2>
                <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground text-sm">Month</span>
                  <IconArrowDown className="text-muted-foreground h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-green-700 dark:text-green-400">
                        Today&apos;s Sales
                      </h3>
                      <IconArrowUp className="h-4 w-4 text-green-400/50" />
                    </div>
                    <div className="mb-2 text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(todaysSales)}
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <IconArrowUp className="h-4 w-4" />
                      <span className="text-sm">
                        {todaysSalesCount} transactions
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        Today&apos;s Purchases
                      </h3>
                      <IconArrowUp className="h-4 w-4 text-orange-400/50" />
                    </div>
                    <div className="mb-2 text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {formatCurrency(todaysPurchases)}
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <IconArrowUp className="h-4 w-4" />
                      <span className="text-sm">
                        {todaysPurchasesCount} transactions
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Outstanding
                      </h3>
                      <IconArrowUp className="h-4 w-4 text-blue-400/50" />
                    </div>
                    <div className="mb-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(totalOutstanding || 0)}
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <IconArrowUp className="h-4 w-4" />
                      <span className="text-sm">
                        {outstandingCount} pending
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Top Products - Enhanced Card Style */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-foreground text-xl font-semibold">
                  Top Products
                </h2>
                <button className="text-primary hover:text-primary/90 text-sm font-medium">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {topProducts.length > 0 ? (
                  topProducts.slice(0, 4).map((product, index) => (
                    <div
                      key={product.productId}
                      className="rounded-xl bg-gradient-to-r from-[#5C86C9] to-[#3B6CC2] p-4 text-white"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-medium">
                          #{index + 1} Product
                        </div>
                        <IconPackage className="h-5 w-5" />
                      </div>
                      <div className="mb-2 text-xl font-bold break-words md:text-2xl">
                        {product.product?.product_name || "Unknown"}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-80">
                            Stock: {product.product?.stock || 0}
                          </div>
                          <div className="text-xs opacity-60">
                            Sold: {product._sum.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-medium">TOP</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No product data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Transactions */}
        <div className="bg-card border-border w-full border-t p-6 lg:w-80 lg:border-t-0 lg:border-l">
          {/* Transactions */}
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">
                Transactions
              </h2>
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <span className="text-muted-foreground text-sm">Month</span>
                <IconArrowDown className="text-muted-foreground h-4 w-4" />
              </div>
            </div>
            <div className="space-y-4">
              {recentSales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <IconCurrencyDollar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-foreground line-clamp-1 text-sm font-medium">
                        {sale.customer.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(sale.salesdate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground text-sm font-semibold">
                      {formatCurrency(sale.grandTotal)}
                    </p>
                    <div className="bg-muted ml-auto flex h-4 w-4 items-center justify-center rounded-full">
                      <span className="text-muted-foreground text-xs">0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Levels */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">
                Stock Levels
              </h2>
              <button className="text-primary hover:text-primary/90 text-sm font-medium">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {stockLevels.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="border-border flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <IconPackage className="text-muted-foreground h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-foreground line-clamp-1 text-sm font-medium">
                        {product.product_name}
                      </p>

                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold ${product.stock < 10
                      ? "text-red-600 dark:text-red-400"
                      : product.stock < 50
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-green-600 dark:text-green-400"
                      }`}
                  >
                    {product.stock}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
