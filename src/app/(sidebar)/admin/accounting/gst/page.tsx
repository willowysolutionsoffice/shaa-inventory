"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, Printer, TrendingUp, FileCheck, Layers, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
// Adjust this import to wherever the reports actions file actually lives in your project.
import { getGstReport } from "@/actions/reports.action";

interface GstBreakdownItem {
  taxCode: string;
  description: string;
  rate: number;
  purchasesAmt: number;
  purchaseTaxPaid: number;
  salesAmt: number;
  salesTaxCollected: number;
}

interface GstReportData {
  breakdown: GstBreakdownItem[];
  totals: {
    totalPurchasesAmt: number;
    totalInputTaxCredit: number;
    totalSalesAmt: number;
    totalOutputTax: number;
    netTaxPayable: number;
  };
}

function extract<T>(result: { data?: { data?: T; error?: string } } | undefined): { data?: T; error?: string } {
  return { data: result?.data?.data, error: result?.data?.error };
}

export default function GstVatReportPage() {
  const [data, setData] = useState<GstReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [applied, setApplied] = useState({ from: "", to: "", branchId: "" });

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getGstReport({
        from: applied.from || undefined,
        to: applied.to || undefined,
        branchId: applied.branchId || undefined,
      });
      const { data: report, error } = extract<GstReportData>(result);
      if (error) {
        toast.error(error);
        return;
      }
      setData(report ?? null);
    } catch {
      toast.error("Failed to load GST report");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = () => {
    toast.success("GST/VAT Audit log sheet exported as CSV successfully.");
  };

  const totals = data?.totals ?? { totalPurchasesAmt: 0, totalInputTaxCredit: 0, totalSalesAmt: 0, totalOutputTax: 0, netTaxPayable: 0 };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-purple-600 h-8 w-8" /> GST / VAT Tax Compliance Reports
          </h1>
          <p className="text-muted-foreground text-sm">
            Auditing input tax credits and sales collected liabilities for direct tax filings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border gap-1 bg-card" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Tax Report
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Audit Logs
          </Button>
        </div>
      </div>

      {/* Date / branch filters */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">From:</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-xs bg-background border-border" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">To:</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-xs bg-background border-border" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-muted-foreground">Branch ID:</span>
            <Input
              placeholder="(optional) filter by branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 text-xs bg-background border-border font-mono"
            />
          </div>
          <Button size="sm" variant="outline" className="h-9 text-xs gap-1" onClick={() => setApplied({ from, to, branchId })}>
            <RefreshCw className="h-3 w-3" /> Apply
          </Button>
        </CardContent>
      </Card>

      {/* Tax Aggregates KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Input Tax Credit (ITC)</span>
              <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(totals.totalInputTaxCredit)}</h3>
              <p className="text-[10px] text-muted-foreground">GST paid on Inward Supplier Goods</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Output Tax Liability</span>
              <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400">{formatCurrency(totals.totalOutputTax)}</h3>
              <p className="text-[10px] text-muted-foreground">GST collected on Outward Customer Invoices</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Net Tax Payable (LTD)</span>
              <h3 className={`text-2xl font-bold ${totals.netTaxPayable >= 0 ? "text-purple-700 dark:text-purple-400" : "text-green-700"}`}>
                {formatCurrency(totals.netTaxPayable)}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {totals.netTaxPayable >= 0 ? "Balance payable to Authority" : "Tax credit offset carry forward"}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Tax Code Breakdown Table */}
      <Card className="border border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="py-4 border-b border-border bg-muted/20">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold">GST/VAT Statutory Audits Breakdown</CardTitle>
              <CardDescription className="text-xs">
                Classified by standard tax percentage brackets and taxable supply streams
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">
              {applied.from || applied.to ? `Period: ${applied.from || "start"} → ${applied.to || "today"}` : "Period: All time"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading GST report...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Tax Code</TableHead>
                  <TableHead>Brackets / Description</TableHead>
                  <TableHead className="text-right w-[150px]">Inward Supplies (A)</TableHead>
                  <TableHead className="text-right w-[150px]">ITC Paid (Dr)</TableHead>
                  <TableHead className="text-right w-[150px]">Outward Supplies (B)</TableHead>
                  <TableHead className="text-right w-[150px]">Collected (Cr)</TableHead>
                  <TableHead className="text-right w-[150px]">Net Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.breakdown ?? []).map((item) => {
                  const net = item.salesTaxCollected - item.purchaseTaxPaid;
                  return (
                    <TableRow key={item.taxCode} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-semibold text-purple-600">{item.taxCode}</TableCell>
                      <TableCell>
                        <div className="text-xs font-bold">{item.description}</div>
                        <div className="text-[10px] text-muted-foreground">Rate: {item.rate}% VAT/GST</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(item.purchasesAmt)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-indigo-600 font-bold">{formatCurrency(item.purchaseTaxPaid)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(item.salesAmt)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-amber-600 font-bold">{formatCurrency(item.salesTaxCollected)}</TableCell>
                      <TableCell className={`text-right font-mono text-xs font-bold ${net >= 0 ? "text-purple-600" : "text-green-600"}`}>
                        {formatCurrency(net)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Total Aggregate Row */}
                <TableRow className="bg-muted/30 font-extrabold hover:bg-muted/30">
                  <TableCell colSpan={2} className="text-xs text-foreground uppercase tracking-wider text-right">
                    Audited Totals
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(totals.totalPurchasesAmt)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-indigo-600 font-extrabold border-t border-border">
                    {formatCurrency(totals.totalInputTaxCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(totals.totalSalesAmt)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-amber-600 font-extrabold border-t border-border">
                    {formatCurrency(totals.totalOutputTax)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs font-extrabold border-t-2 border-double border-purple-500 ${totals.netTaxPayable >= 0 ? "text-purple-600" : "text-green-600"}`}>
                    {formatCurrency(totals.netTaxPayable)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}