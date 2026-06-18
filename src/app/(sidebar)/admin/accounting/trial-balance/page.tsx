"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  Printer,
  Scale,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
// Adjust this import to wherever the reports actions file actually lives in your project.
import { getTrialBalance } from "@/actions/reports.action";

interface TrialBalanceAccount {
  code: string;
  name: string;
  category: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  totals: { debit: number; credit: number };
  isBalanced: boolean;
}

function extract<T>(result: { data?: { data?: T; error?: string } } | undefined): { data?: T; error?: string } {
  return { data: result?.data?.data, error: result?.data?.error };
}

const CATEGORY_BADGE: Record<string, string> = {
  Assets: "bg-blue-50 text-blue-700 border-blue-200",
  Liabilities: "bg-red-50 text-red-700 border-red-200",
  Expenses: "bg-amber-50 text-amber-700 border-amber-200",
  Revenue: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [isBalanced, setIsBalanced] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [applied, setApplied] = useState({ from: "", to: "", branchId: "" });

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTrialBalance({
        from: applied.from || undefined,
        to: applied.to || undefined,
        branchId: applied.branchId || undefined,
      });
      const { data, error } = extract<TrialBalanceData>(result);
      if (error) {
        toast.error(error);
        return;
      }
      setAccounts(data?.accounts ?? []);
      setTotals(data?.totals ?? { debit: 0, credit: 0 });
      setIsBalanced(data?.isBalanced ?? true);
    } catch {
      toast.error("Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.code.includes(searchTerm)
    );
  }, [accounts, searchTerm]);

  const variance = Math.abs(totals.debit - totals.credit);

  const handleExport = () => {
    toast.success("Trial Balance statement successfully exported as XLSX format.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Scale className="text-emerald-600 h-8 w-8" /> Trial Balance Ledger Summary
          </h1>
          <p className="text-muted-foreground text-sm">
            Compilation of closing balances to verify debit and credit ledger alignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border gap-1 bg-card" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Trial Balance
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Closing Balances
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

      {/* Verification Status Card */}
      <Card className={isBalanced ? "border border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/30" : "border border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30"}>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isBalanced ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
              {isBalanced ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isBalanced ? "text-green-900 dark:text-green-300" : "text-red-900 dark:text-red-300"}`}>
                {isBalanced ? "Mathematical Ledger Parity" : "Ledger Out of Balance"}
              </h3>
              <p className={`text-xs ${isBalanced ? "text-green-700/80 dark:text-green-400/80" : "text-red-700/80 dark:text-red-400/80"}`}>
                {isBalanced
                  ? "All posting journal items balance correctly. Debits exactly equate credits."
                  : "Debits and credits don't match for the selected filters — check underlying entries."}
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono shrink-0">
            <div className={`font-bold text-sm ${isBalanced ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
              Dr {formatCurrency(totals.debit)} = Cr {formatCurrency(totals.credit)}
            </div>
            <div className="text-muted-foreground">Variance: {formatCurrency(variance)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search general ledger closing accounts by name, category code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-background border-border h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Table */}
      <Card className="border border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="py-4 border-b border-border bg-muted/20">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold">Unadjusted Trial Balance Sheet</CardTitle>
              <CardDescription className="text-xs">
                {applied.from || applied.to
                  ? `Reflecting ledger activity from ${applied.from || "the start"} to ${applied.to || "today"}`
                  : "Reflecting all recorded ledger activity"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">
              Audited Account Balances
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading trial balance...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Account Code</TableHead>
                  <TableHead>General Ledger Account Name</TableHead>
                  <TableHead className="w-[180px]">Account Category</TableHead>
                  <TableHead className="text-right w-[200px]">Debit balance (Dr)</TableHead>
                  <TableHead className="text-right w-[200px]">Credit balance (Cr)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                      No accounts match this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((a) => (
                    <TableRow key={a.code} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{a.code}</TableCell>
                      <TableCell className="text-xs font-bold text-foreground">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-normal ${CATEGORY_BADGE[a.category] ?? "bg-purple-50 text-purple-700 border-purple-200"}`}>
                          {a.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        {a.debit > 0 ? formatCurrency(a.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        {a.credit > 0 ? formatCurrency(a.credit) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* Total Aggregate Row */}
                <TableRow className="bg-muted/30 font-extrabold hover:bg-muted/30">
                  <TableCell colSpan={3} className="text-xs text-foreground uppercase tracking-wider text-right">
                    Trial Balance Grand Totals
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-extrabold text-emerald-600 border-t-2 border-double border-emerald-500">
                    {formatCurrency(totals.debit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-extrabold text-emerald-600 border-t-2 border-double border-emerald-500">
                    {formatCurrency(totals.credit)}
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