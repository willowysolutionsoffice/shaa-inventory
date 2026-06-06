// src/components/analytics/customer-analytics-client.tsx
"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Props {
  metrics: {
    totalCustomers: number;
    totalRevenue: number;
    totalSalesDue: number;
    avgLoyaltyPoints: number;
  };
  tierCounts: { Bronze: number; Silver: number; Gold: number; Platinum: number };
  customerStats: { name: string; salesDue: number }[];
  monthlyByCustomer: { name: string; data: number[] }[];
  monthLabels: string[];
  frequencyBuckets: { once: number; twice: number; threeplus: number };
  topCustomers: {
    name: string;
    initials: string;
    totalSpent: number;
    purchaseCount: number;
  }[];
}

const CHART_COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#BA7517"];
const TIER_COLORS = {
  Bronze: "#cd7f32",
  Silver: "#9e9e9e",
  Gold: "#f5a623",
  Platinum: "#7F77DD",
};

export function CustomerAnalyticsClient({
  metrics,
  tierCounts,
  customerStats,
  monthlyByCustomer,
  monthLabels,
  frequencyBuckets,
  topCustomers,
}: Props) {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<any[]>([]);

  useEffect(() => {
    // destroy previous instances
    chartInstances.current.forEach((c) => c?.destroy());
    chartInstances.current = [];

    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => {
      const Chart = (window as any).Chart;

      if (barChartRef.current) {
        const c = new Chart(barChartRef.current, {
          type: "bar",
          data: {
            labels: monthLabels,
            datasets: monthlyByCustomer.map((c, i) => ({
              label: c.name,
              data: c.data,
              backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { color: "#888" } },
              y: {
                stacked: true,
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

      const total =
        frequencyBuckets.once + frequencyBuckets.twice + frequencyBuckets.threeplus;
      if (donutRef.current) {
        const c = new Chart(donutRef.current, {
          type: "doughnut",
          data: {
            labels: ["Once", "Twice", "3+ times"],
            datasets: [
              {
                data: [
                  frequencyBuckets.once,
                  frequencyBuckets.twice,
                  frequencyBuckets.threeplus,
                ],
                backgroundColor: ["#7F77DD", "#1D9E75", "#D85A30"],
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
  }, [monthlyByCustomer, monthLabels, frequencyBuckets]);

  const totalTiers = Object.values(tierCounts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total customers", value: metrics.totalCustomers, color: "" },
          {
            label: "Total revenue",
            value: formatCurrency(metrics.totalRevenue),
            color: "text-green-600",
          },
          {
            label: "Sales due",
            value: formatCurrency(metrics.totalSalesDue),
            color: "text-red-500",
          },
          {
            label: "Avg loyalty pts",
            value: metrics.avgLoyaltyPoints + " pts",
            color: "text-purple-600",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-muted/50 rounded-lg p-4"
          >
            <div className={`text-2xl font-medium mb-1 ${m.color}`}>
              {m.value}
            </div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Loyalty tier distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["Platinum", "Gold", "Silver", "Bronze"] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-muted-foreground text-xs">{tier}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:
                        totalTiers > 0
                          ? `${(tierCounts[tier] / totalTiers) * 100}%`
                          : "0%",
                      background: TIER_COLORS[tier],
                    }}
                  />
                </div>
                <span className="w-4 text-right font-medium">{tierCounts[tier]}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              1 pt per ₹100 spent · Silver 200+ · Gold 500+ · Platinum 1000+
            </p>
          </CardContent>
        </Card>

        {/* Payment status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {customerStats.map((c) => (
              <div
                key={c.name}
                className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 text-sm"
              >
                <span>{c.name}</span>
                {c.salesDue > 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">
                    {formatCurrency(c.salesDue)} due
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                    Paid
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly sales by customer
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-1">
            {monthlyByCustomer.map((c, i) => (
              <span
                key={c.name}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-52">
            <canvas ref={barChartRef} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top customers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top customers by spend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topCustomers.map((c, i) => (
              <div
                key={c.name}
                className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0 text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                  {i + 1}
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-medium text-purple-700">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.purchaseCount} purchase{c.purchaseCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="font-medium">{formatCurrency(c.totalSpent)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Purchase frequency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Purchase frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-40">
              <canvas ref={donutRef} />
            </div>
            <div className="flex justify-center flex-wrap gap-3 mt-3">
              {[
                { label: "Once", color: "#7F77DD", val: frequencyBuckets.once },
                { label: "Twice", color: "#1D9E75", val: frequencyBuckets.twice },
                { label: "3+ times", color: "#D85A30", val: frequencyBuckets.threeplus },
              ].map((l) => (
                <span
                  key={l.label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: l.color }}
                  />
                  {l.label} ({l.val})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}