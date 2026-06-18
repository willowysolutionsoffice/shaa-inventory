"use client"

import * as React from "react"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { formatDate } from "@/lib/utils"
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
    color: "hsl(var(--chart-1))",
  },
  purchases: {
    label: "Purchases",
    color: "hsl(var(--chart-2))",
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
        <CardTitle className="text-gray-800 dark:text-gray-100">
          Sales vs Purchases
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          <span className="hidden @[540px]/card:block">{selectedLabel}</span>
          <span className="@[540px]/card:hidden">
            {timeRange === "30d" ? "30 days" : timeRange === "14d" ? "14 days" : "7 days"}
          </span>
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
                <stop offset="5%"  stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day:   "numeric",
                })
              }
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
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
            />
            <Area
              dataKey="purchases"
              type="natural"
              fill="url(#fillPurchases)"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}