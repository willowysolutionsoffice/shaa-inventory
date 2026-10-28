"use client"

import * as React from "react"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { formatDate, CURRENCY_SYMBOL } from "@/lib/utils"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { YAxis } from "recharts"

type MonthlyData = {
  date: string
  sales: number
  purchases: number
}

interface ChartAreaInteractiveProps {
  data: MonthlyData[]
}

const chartConfig = {
  sales: {
    label: "Sales",
    color: "#6366f1",
  },
  purchases: {
    label: "Purchases",
    color: "#f43f5e",
  },
} satisfies ChartConfig

// Backend returns last 30 days max, so cap options at 30d
type TimeRange = "30d" | "14d" | "7d"

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "14d", label: "Last 14 days", days: 14 },
  { value: "7d",  label: "Last 7 days",  days: 7  },
]

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const selectedDays = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.days ?? 30

  const filteredData = data.filter((item) => {
    const date          = new Date(item.date)
    const startDate     = new Date()
    startDate.setDate(startDate.getDate() - selectedDays)
    startDate.setHours(0, 0, 0, 0)
    return date >= startDate
  })

  const selectedLabel = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label ?? "Last 30 days"

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-indigo-900/30 dark:via-gray-900 dark:to-emerald-900/30 shadow-md transition-all duration-500 hover:shadow-lg">
      {/* Decorative background blur */}
      <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-br from-indigo-300/30 to-emerald-300/30 pointer-events-none" />

      <CardHeader className="relative z-10">
        <CardTitle className="text-sm sm:text-base font-bold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-3">
          <span>SALES VS PURCHASES</span>
          <div className="flex items-center gap-2 text-xs font-semibold normal-case tracking-normal">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
              <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block" />
              Sales
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
              Purchases
            </span>
          </div>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Comparison of sales revenue and purchase expenses over {selectedLabel.toLowerCase()}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as TimeRange)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            {TIME_RANGE_OPTIONS.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value}>
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger
              className="flex w-40 @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {TIME_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="relative z-10 px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" opacity={0.6} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day:   "numeric",
                })
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(value) => {
                if (value === 0) return `${CURRENCY_SYMBOL}0`;
                if (Math.abs(value) >= 100000) return `${CURRENCY_SYMBOL}${(value / 100000).toFixed(1)}L`;
                if (Math.abs(value) >= 1000) return `${CURRENCY_SYMBOL}${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
                return `${CURRENCY_SYMBOL}${value}`;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(value)}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <Area
              dataKey="purchases"
              type="natural"
              fill="url(#fillPurchases)"
              stroke="#f43f5e"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}