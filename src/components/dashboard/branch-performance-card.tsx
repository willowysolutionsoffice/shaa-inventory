"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Store,
  Layers,
  ExternalLink,
} from "lucide-react";

export interface BranchPerformanceItem {
  id: string;
  name: string;
  pct: number;
  curr?: number;
  prev?: number;
}

export interface BranchDropdownItem {
  id: string;
  name: string;
}

interface BranchPerformanceCardProps {
  branchPerf: BranchPerformanceItem[];
  overallStatus: string;
  branches: BranchDropdownItem[];
  selectedBranchId?: string;
  className?: string;
}

export function BranchPerformanceCard({
  branchPerf,
  overallStatus,
  branches,
  selectedBranchId,
  className,
}: BranchPerformanceCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleBranchChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("branchId");
      } else {
        params.set("branchId", value);
      }
      const query = params.toString();
      router.push(`/dashboard${query ? `?${query}` : ""}`);
    });
  };

  const selectedBranchName =
    selectedBranchId && branches.length > 0
      ? branches.find((b) => b.id === selectedBranchId)?.name
      : null;

  // Selected or primary branch data
  const primaryBranch =
    (selectedBranchId
      ? branchPerf.find((b) => b.id === selectedBranchId)
      : branchPerf[0]) || branchPerf[0];

  const pct = primaryBranch ? primaryBranch.pct : 0;
  const isZeroWithHistory =
    primaryBranch && primaryBranch.curr === 0 && (primaryBranch.prev ?? 0) > 0;

  return (
    <Card
      className={cn(
        "border-border shadow-md bg-card relative overflow-hidden flex flex-col justify-between transition-all h-full",
        className
      )}
    >
      {/* Decorative colored accent left border */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1.5 h-full",
          overallStatus === "Optimal"
            ? "bg-emerald-500"
            : overallStatus === "Needs Attention"
            ? "bg-amber-500"
            : "bg-blue-500"
        )}
      />

      <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
        {/* 1. Header: Title & Subtitle + Selector */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                BRANCH PERFORMANCE
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Weekly sales comparison by branch
            </p>
          </div>

          {/* 2. Full-Width Change Branch Selector */}
          <Select
            value={selectedBranchId || "all"}
            onValueChange={handleBranchChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7.5 text-xs bg-muted/40 hover:bg-muted/70 border-border/80 w-full flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <Store className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span className="truncate">
                  {selectedBranchName
                    ? selectedBranchName
                    : branches.length === 1
                    ? branches[0].name
                    : `All Branches (${branches.length})`}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent align="start" className="text-xs">
              <SelectItem value="all" className="text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  All Branches ({branches.length})
                </div>
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Store className="h-3.5 w-3.5 text-purple-600" />
                    <span className="truncate">{b.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Middle: Status Badge + Growth Percentage */}
        <div className="space-y-2 py-0.5">
          {!primaryBranch ? (
            <div className="py-2 text-center bg-muted/20 rounded-md border border-dashed border-border">
              <p className="text-[11px] text-muted-foreground">
                No sales data recorded yet for this period.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                {/* Health Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap border shrink-0",
                    overallStatus === "Optimal" &&
                      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
                    overallStatus === "Needs Attention" &&
                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
                    overallStatus === "On Track" &&
                      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
                    overallStatus === "No Data" &&
                      "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {overallStatus}
                </Badge>

                {/* Percentage with Trend */}
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded shrink-0",
                    pct >= 80
                      ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                      : pct >= 50
                      ? "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
                      : isZeroWithHistory
                      ? "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
                      : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
                  )}
                >
                  {pct >= 80 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : pct > 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  <span>{pct}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-muted/70 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    pct >= 80
                      ? "bg-emerald-500"
                      : pct >= 50
                      ? "bg-blue-500"
                      : isZeroWithHistory
                      ? "bg-red-500"
                      : pct > 0
                      ? "bg-amber-500"
                      : "bg-muted-foreground/30"
                  )}
                  style={{
                    width: `${Math.max(isZeroWithHistory ? 4 : 0, Math.min(pct, 100))}%`,
                  }}
                />
              </div>

              {/* Numeric figures: This Week vs Last Week */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="truncate">
                  This: <strong className="text-foreground font-semibold">{formatCurrency(primaryBranch.curr ?? 0)}</strong>
                </span>
                <span className="truncate text-right">
                  Last: <strong className="text-foreground font-semibold">{formatCurrency(primaryBranch.prev ?? 0)}</strong>
                </span>
              </div>
            </>
          )}
        </div>

        {/* 4. Footer: Comparison Subtitle & Management Link */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="italic truncate">This week vs last week sales</span>
          <Link
            href="/admin/branches"
            className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5 shrink-0 ml-1"
          >
            Manage
            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
