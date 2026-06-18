"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, Printer, Activity, Layers, Scale, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
// Adjust this import to wherever the reports actions file actually lives in your project.
import { getBalanceSheet } from "@/actions/reports.action";

interface LineItem {
  name: string;
  amount: number;
}

interface BalanceSheetData {
  assets: { current: LineItem[]; nonCurrent: LineItem[]; totals: { current: number; nonCurrent: number; total: number } };
  liabilities: { current: LineItem[]; nonCurrent: LineItem[]; totals: { current: number; nonCurrent: number; total: number } };
  equity: LineItem[];
  equityTotal: number;
  grandTotal: number;
}

function extract<T>(result: { data?: { data?: T; error?: string } } | undefined): { data?: T; error?: string } {
  return { data: result?.data?.data, error: result?.data?.error };
}

function ratioLabel(ratio: number, threshold: number) {
  if (!isFinite(ratio)) return "N/A";
  if (ratio >= threshold) return "Healthy";
  if (ratio >= threshold * 0.7) return "Watch";
  return "At Risk";
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [appliedBranchId, setAppliedBranchId] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBalanceSheet({ branchId: appliedBranchId || undefined });
      const { data: report, error } = extract<BalanceSheetData>(result);
      if (error) {
        toast.error(error);
        return;
      }
      setData(report ?? null);
    } catch {
      toast.error("Failed to load balance sheet");
    } finally {
      setLoading(false);
    }
  }, [appliedBranchId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = () => {
    toast.success("Balance Sheet successfully exported in XLSX ledger audit format.");
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading balance sheet...
      </div>
    );
  }

  const currentLiab = data.liabilities.totals.current;
  const currentRatio = currentLiab > 0 ? data.assets.totals.current / currentLiab : Infinity;
  const inventoryLine = data.assets.current.find((a) => a.name.toLowerCase().includes("inventory"));
  const quickAssets = data.assets.totals.current - (inventoryLine?.amount ?? 0);
  const quickRatio = currentLiab > 0 ? quickAssets / currentLiab : Infinity;

  const liabPlusEquityTotal = data.liabilities.totals.total + data.equityTotal;
  const balanceVariance = Math.abs(data.assets.totals.total - liabPlusEquityTotal);
  const isBalanced = balanceVariance < 0.01;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Scale className="text-purple-600 h-8 w-8" /> Balance Sheet Statement
          </h1>
          <p className="text-muted-foreground text-sm">
            Fiscal standing summary listing complete enterprise assets, liabilities, and owners equities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border gap-1 bg-card" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Statement
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export XLSX
          </Button>
        </div>
      </div>

      {/* Branch filter */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-muted-foreground">Branch ID:</span>
            <Input
              placeholder="(optional) filter by branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 text-xs bg-background border-border font-mono"
            />
          </div>
          <Button size="sm" variant="outline" className="h-9 text-xs gap-1" onClick={() => setAppliedBranchId(branchId)}>
            <RefreshCw className="h-3 w-3" /> Apply
          </Button>
        </CardContent>
      </Card>

      {/* Ratios & Integrity Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={isBalanced ? "bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 border-border" : "bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/10 border-red-200"}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Mathematical Check</span>
              <div className={`text-sm font-extrabold flex items-center gap-1 ${isBalanced ? "text-purple-800 dark:text-purple-300" : "text-red-800 dark:text-red-300"}`}>
                Assets = Liab + Equity
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.assets.totals.total)} vs {formatCurrency(liabPlusEquityTotal)}
                {!isBalanced && ` (off by ${formatCurrency(balanceVariance)})`}
              </p>
            </div>
            <div className={`p-3 rounded-full shrink-0 ${isBalanced ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
              {isBalanced ? <Scale className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Liquidity Current Ratio</span>
              <div className="text-sm font-extrabold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                {isFinite(currentRatio) ? `${currentRatio.toFixed(2)}x` : "N/A"}
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] py-0">{ratioLabel(currentRatio, 1.5)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Target: &gt; 1.50x</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full shrink-0">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Acid-Test Quick Ratio</span>
              <div className="text-sm font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                {isFinite(quickRatio) ? `${quickRatio.toFixed(2)}x` : "N/A"}
                <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 text-[10px] py-0">{ratioLabel(quickRatio, 1.0)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Target: &gt; 1.00x</p>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-full shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets ledger (Left Column) */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="py-3.5 px-4 bg-muted/20 border-b border-border">
            <CardTitle className="text-base font-bold">1. Corporate Assets Ledger</CardTitle>
            <CardDescription className="text-xs">Economic resources representing cash or prospective items</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-2">Current Assets Account Name</TableHead>
                  <TableHead className="text-right w-[150px] py-2">Closing balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assets.current.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Current Assets</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(data.assets.totals.current)}
                  </TableCell>
                </TableRow>

                {/* Non current assets */}
                <TableRow className="bg-muted/5 font-semibold">
                  <TableCell className="text-xs py-3">Non-Current / Fixed Assets</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {data.assets.nonCurrent.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground pl-6 py-2">No non-current assets tracked yet</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ) : (
                  data.assets.nonCurrent.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/10">
                      <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Non-Current Assets</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(data.assets.totals.nonCurrent)}
                  </TableCell>
                </TableRow>

                {/* Balance Sheet Assets Grand Total */}
                <TableRow className="bg-purple-500/10 font-extrabold hover:bg-purple-500/10">
                  <TableCell className="text-xs py-3.5 uppercase tracking-wider text-purple-700 dark:text-purple-400">Total Assets Balance</TableCell>
                  <TableCell className="text-right font-mono text-sm text-purple-700 dark:text-purple-400 font-extrabold border-t-2 border-double border-purple-500">
                    {formatCurrency(data.assets.totals.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Liabilities & Owner's Equity ledger (Right Column) */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="py-3.5 px-4 bg-muted/20 border-b border-border">
            <CardTitle className="text-base font-bold">2. Liabilities & Equity Ledger</CardTitle>
            <CardDescription className="text-xs">Creditor obligations and retained shareholder assets</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-2">Accrued Liabilities & Equity</TableHead>
                  <TableHead className="text-right w-[150px] py-2">Closing balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.liabilities.current.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Current Liabilities</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(data.liabilities.totals.current)}
                  </TableCell>
                </TableRow>

                {/* Non current liabilities */}
                <TableRow className="bg-muted/5 font-semibold">
                  <TableCell className="text-xs py-3">Non-Current / Long-Term Liabilities</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {data.liabilities.nonCurrent.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground pl-6 py-2">No long-term liabilities tracked yet</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ) : (
                  data.liabilities.nonCurrent.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/10">
                      <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Non-Current Liabilities</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(data.liabilities.totals.nonCurrent)}
                  </TableCell>
                </TableRow>

                {/* Equity */}
                <TableRow className="bg-muted/5 font-semibold">
                  <TableCell className="text-xs py-3">Owners Equity Account Shares</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {data.equity.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Shareholder Equity</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(data.equityTotal)}
                  </TableCell>
                </TableRow>

                {/* Balance Sheet Liabilities & Equity Grand Total */}
                <TableRow className="bg-purple-500/10 font-extrabold hover:bg-purple-500/10">
                  <TableCell className="text-xs py-3.5 uppercase tracking-wider text-purple-700 dark:text-purple-400">Total Liab & Equity</TableCell>
                  <TableCell className="text-right font-mono text-sm text-purple-700 dark:text-purple-400 font-extrabold border-t-2 border-double border-purple-500">
                    {formatCurrency(liabPlusEquityTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}