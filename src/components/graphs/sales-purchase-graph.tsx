"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CURRENCY_SYMBOL } from "@/lib/utils"

type MonthlyData = {
  date: string
  sales: number
  purchases: number
}

interface DashboardChartsProps {
  data: MonthlyData[]
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Format date strings to short month+day labels for the X-axis
  const chartData = data.map((item) => ({
    ...item,
    label: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
    }),
  }))

  return (
    <Card className="shadow-md border border-border/50 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-indigo-950/30 dark:via-sidebar dark:to-emerald-950/30">
      <CardHeader>
        <CardTitle>Monthly Sales &amp; Purchases</CardTitle>
        <CardDescription>
          Comparison of sales and purchase trends over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm dark:bg-black/20">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                angle={-45}
                textAnchor="end"
                height={60}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) =>
                  `${CURRENCY_SYMBOL}${(value / 1000).toFixed(0)}k`
                }
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderRadius:    "8px",
                  border:          "1px solid var(--border)",
                  boxShadow:       "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  color:           "var(--popover-foreground)",
                }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value: number, name: string) => [
                  `${CURRENCY_SYMBOL}${value.toLocaleString()}`,
                  name === "sales" ? "Sales" : "Purchases",
                ]}
                labelFormatter={(label) => label}
                cursor={{ fill: "var(--muted)", opacity: 0.2 }}
              />

              <Legend
                wrapperStyle={{ paddingTop: "12px" }}
                iconType="circle"
                verticalAlign="bottom"
              />

              <Bar
                dataKey="sales"
                fill="var(--chart-1)"
                name="Sales"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="purchases"
                fill="var(--chart-2)"
                name="Purchases"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}