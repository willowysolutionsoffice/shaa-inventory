// src/components/analytics/financial-analytics-client.tsx
"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Props {
  pnl: {
    totalRevenue: number;
    totalSalesReturn: number;
    netRevenue: number;
    totalPurchases: number;
    totalPurchaseReturn: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
  };
  metrics: {
    totalRevenue: number;
    totalPurchases: number;
    totalExpenses: number;
    totalPurchaseDue: number;
  };
  expenseByCategory: { name: string; total: number }[];
  supplierDues: {
    name: string;
    due: number;
    purchaseNo: string;
    status: string;
  }[];
  collection: {
    salesCollected: number;
    totalSalesDue: number;
    salesCollectionPct: number;
    purchasesPaid: number;
    totalPurchaseDue: number;
    purchasePaymentPct: number;
  };
  monthly: {
    labels: string[];
    revenue: number[];
    purchases: number[];
    expenses: number[];
  };
}

export function FinancialAnalyticsClient({
  pnl,
  metrics,
  expenseByCategory,
  supplierDues,
  collection,
  monthly,
}: Props) {
  const lineRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<any[]>([]);

  useEffect(() => {
    chartInstances.current.forEach((c) => c?.destroy());
    chartInstances.current = [];

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => {
      const Chart = (window as any).Chart;

      if (lineRef.current) {
        const c = new Chart(lineRef.current, {
          type: "line",
          data: {
            labels: monthly.labels,
            datasets: [
              {
                label: "Revenue",
                data: monthly.revenue,
                borderColor: "#7F77DD",
                backgroundColor: "rgba(127,119,221,0.08)",
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: "#7F77DD",
                fill: true,
                tension: 0.35,
              },
              {
                label: "Purchases",
                data: monthly.purchases,
                borderColor: "#1D9E75",
                backgroundColor: "rgba(29,158,117,0.05)",
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: "#1D9E75",
                borderDash: [5, 4],
                fill: true,
                tension: 0.35,
              },
              {
                label: "Expenses",
                data: monthly.expenses,
                borderColor: "#D85A30",
                backgroundColor: "rgba(216,90,48,0.05)",
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: "#D85A30",
                borderDash: [3, 3],
                fill: false,
                tension: 0.35,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: "#888" },
              },
              y: {
                grid: { color: "rgba(128,128,128,0.1)" },
                ticks: {
                  color: "#888",
                  callback: (v: number) => "₹" + Math.round(v / 1000) + "k",
                },
              },
            },
          },
        });
        chartInstances.current.push(c);
      }

      if (donutRef.current && expenseByCategory.length > 0) {
        const colors = ["#7F77DD", "#D85A30", "#1D9E75", "#BA7517", "#9e9e9e"];
        const c = new Chart(donutRef.current, {
          type: "doughnut",
          data: {
            labels: expenseByCategory.map((e) => e.name),
            datasets: [
              {
                data: expenseByCategory.map((e) => e.total),
                backgroundColor: colors.slice(0, expenseByCategory.length),
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: "65%",
          },
        });
        chartInstances.current.push(c);
      }
    };
    document.head.appendChild(script);

    return () => {
      chartInstances.current.forEach((c) => c?.destroy());
    };
  }, [monthly, expenseByCategory]);

  const expenseColors = ["#7F77DD", "#D85A30", "#1D9E75", "#BA7517", "#9e9e9e"];
  const maxExp = Math.max(...expenseByCategory.map((e) => e.total), 1);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total revenue",
            value: formatCurrency(metrics.totalRevenue),
            sub: `${Object.keys(metrics).length} sales`,
            color: "text-green-600",
          },
          {
            label: "Total purchases",
            value: formatCurrency(metrics.totalPurchases),
            color: "",
          },
          {
            label: "Total expenses",
            value: formatCurrency(metrics.totalExpenses),
            color: "text-red-500",
          },
          {
            label: "Supplier dues",
            value: formatCurrency(metrics.totalPurchaseDue),
            color: "text-amber-600",
          },
        ].map((m) => (
          <div key={m.label} className="bg-muted/50 rounded-lg p-4">
            <div className={`text-2xl font-medium mb-1 ${m.color}`}>
              {m.value}
            </div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly revenue vs purchases vs expenses
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-1">
            {[
              { label: "Revenue", color: "#7F77DD" },
              { label: "Purchases", color: "#1D9E75" },
              { label: "Expenses", color: "#D85A30" },
            ].map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-56">
            <canvas ref={lineRef} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* P&L Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit &amp; loss summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { label: "Sales revenue", value: pnl.totalRevenue, color: "" },
              {
                label: "Sales returns",
                value: -pnl.totalSalesReturn,
                color: "text-red-500",
              },
              { label: "Net revenue", value: pnl.netRevenue, color: "text-green-600", bold: true },
              { label: "COGS (purchases)", value: -pnl.totalPurchases, color: "text-red-500" },
              {
                label: "Purchase returns",
                value: pnl.totalPurchaseReturn,
                color: "text-green-600",
              },
              {
                label: "Gross profit",
                value: pnl.grossProfit,
                color: pnl.grossProfit >= 0 ? "text-green-600" : "text-red-500",
                bold: true,
              },
              {
                label: "Total expenses",
                value: -pnl.totalExpenses,
                color: "text-red-500",
              },
              {
                label: "Net profit",
                value: pnl.netProfit,
                color: pnl.netProfit >= 0 ? "text-green-600" : "text-red-500",
                bold: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex justify-between py-1.5 border-b border-border/50 last:border-0 text-sm ${
                  row.bold ? "font-medium pt-2" : ""
                }`}
              >
                <span
                  className={
                    row.bold ? "" : "text-muted-foreground"
                  }
                >
                  {row.label}
                </span>
                <span className={row.color}>{formatCurrency(Math.abs(row.value))}{row.value < 0 && row.label !== "Net profit" && row.label !== "Gross profit" ? "" : ""}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expense breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-44">
              <canvas ref={donutRef} />
            </div>
            <div className="space-y-2 mt-4">
              {expenseByCategory.map((e, i) => (
                <div
                  key={e.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: expenseColors[i % expenseColors.length] }}
                  />
                  <span className="flex-1 text-muted-foreground truncate text-xs">
                    {e.name}
                  </span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(e.total / maxExp) * 100}%`,
                        background: expenseColors[i % expenseColors.length],
                      }}
                    />
                  </div>
                  <span className="font-medium text-xs w-20 text-right">
                    {formatCurrency(e.total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier dues */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Supplier dues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {supplierDues.length === 0 ? (
              <p className="text-sm text-muted-foreground">All suppliers paid</p>
            ) : (
              <>
                {supplierDues.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 text-sm"
                  >
                    <div>
                      <div className="truncate max-w-[180px]">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.purchaseNo}
                      </div>
                    </div>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(s.due)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-medium text-sm border-t border-border mt-2">
                  <span>Total due</span>
                  <span className="text-red-500">
                    {formatCurrency(supplierDues.reduce((s, d) => s + d.due, 0))}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Collection rates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment collection rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Sales collected</span>
                <span>
                  {formatCurrency(collection.salesCollected)} (
                  {collection.salesCollectionPct}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${collection.salesCollectionPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Sales outstanding</span>
                <span>
                  {formatCurrency(collection.totalSalesDue)} (
                  {100 - collection.salesCollectionPct}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{
                    width: `${100 - collection.salesCollectionPct}%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">
                Purchase payments
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Paid to suppliers</span>
                  <span>
                    {formatCurrency(collection.purchasesPaid)} (
                    {collection.purchasePaymentPct}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${collection.purchasePaymentPct}%`,
                      background: "#7F77DD",
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}