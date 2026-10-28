"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { Tag, TrendingUp, ExternalLink, Award, Sparkles } from "lucide-react";

export interface BrandPerformanceItem {
  id: string;
  name: string;
  revenue: number;
  units: number;
  pct: number;
}

interface BrandSalesCardProps {
  brandPerf: BrandPerformanceItem[];
  className?: string;
}

const RANK_STYLES = [
  {
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
    bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
  },
  {
    badge: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    bar: "bg-gradient-to-r from-slate-400 to-slate-500",
  },
  {
    badge: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700",
    bar: "bg-gradient-to-r from-orange-400 to-amber-600",
  },
  {
    badge: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700",
    bar: "bg-gradient-to-r from-purple-500 to-indigo-500",
  },
  {
    badge: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700",
    bar: "bg-gradient-to-r from-blue-500 to-cyan-500",
  },
  {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
];

export function BrandSalesCard({ brandPerf, className }: BrandSalesCardProps) {
  const totalRevenue = (brandPerf || []).reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalUnits   = (brandPerf || []).reduce((sum, b) => sum + (b.units || 0), 0);

  return (
    <Card className={cn("border border-border shadow-md bg-card overflow-hidden", className)}>
      <CardHeader className="py-4 px-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/15">
        <div>
          <CardTitle className="text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
            <span className="p-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
              <Sparkles className="h-4 w-4" />
            </span>
            BRAND-WISE SALES PERFORMANCE
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Top revenue generating brands and unit market shares
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {totalRevenue > 0 && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              Total: {formatCurrency(totalRevenue)}
            </Badge>
          )}
          <Link
            href="/admin/brands"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
          >
            All Brands
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {brandPerf.length === 0 ? (
          <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border p-4">
            <Tag className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              No brand sales data recorded yet for this period.
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Sales made through POS will automatically map to product brands.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {brandPerf.map((brand, index) => {
                const style = RANK_STYLES[index % RANK_STYLES.length];
                const pctOfTotal = totalRevenue > 0 ? Math.round((brand.revenue / totalRevenue) * 100) : brand.pct;

                return (
                  <div
                    key={brand.id || index}
                    className="p-3.5 rounded-xl border border-border/80 bg-background/60 hover:bg-muted/30 hover:border-purple-200 dark:hover:border-purple-900/60 transition-all shadow-xs flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "flex items-center justify-center h-6 w-6 rounded-md text-[10px] font-extrabold border shrink-0",
                            style.badge
                          )}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate" title={brand.name}>
                            {brand.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {brand.units} {brand.units === 1 ? "unit" : "units"} sold
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-xs text-foreground">
                          {formatCurrency(brand.revenue)}
                        </p>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          {pctOfTotal}% share
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", style.bar)}
                        style={{ width: `${Math.max(4, Math.min(pctOfTotal, 100))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
