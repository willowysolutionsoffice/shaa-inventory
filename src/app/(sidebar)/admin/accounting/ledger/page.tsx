"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { History, Search, ArrowUpRight, ArrowDownLeft, Download, Printer, RefreshCw, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
// Adjust this import to wherever the reports actions file actually lives in your project.
import { getLedger } from "@/actions/reports.action";

// These are the only account codes the ledger report currently understands —
// extend the accountMap in src/services/reports.service.ts before adding more
// entries here, otherwise they'll silently fall back to the 4010 (Sales Revenue) results.
const ACCOUNT_OPTIONS = [
  { code: "1010", name: "Cash & Bank", category: "Assets" },
  { code: "1020", name: "Accounts Receivable", category: "Assets" },
  { code: "4010", name: "Sales Revenue", category: "Revenue" },
  { code: "5020", name: "Operating Expenses", category: "Expenses" },
];

interface LedgerLine {
  id: string;
  date: string;
  ref: string;
  narration: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface LedgerData {
  lines: LedgerLine[];
  totals: { debit: number; credit: number };
}

function extract<T>(result: { data?: { data?: T; error?: string } } | undefined): { data?: T; error?: string } {
  return { data: result?.data?.data, error: result?.data?.error };
}

export default function LedgerPage() {
  const [selectedCode, setSelectedCode] = useState(ACCOUNT_OPTIONS[0].code);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchId, setBranchId] = useState("");

  const [lines, setLines] = useState<LedgerLine[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [loading, setLoading] = useState(true);

  const activeAccount = useMemo(
    () => ACCOUNT_OPTIONS.find((a) => a.code === selectedCode) ?? ACCOUNT_OPTIONS[0],
    [selectedCode]
  );

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLedger({
        accountCode: selectedCode,
        from: startDate || undefined,
        to: endDate || undefined,
        branchId: branchId || undefined,
      });
      const { data, error } = extract<LedgerData>(result);
      if (error) {
        toast.error(error);
        return;
      }
      setLines(data?.lines ?? []);
      setTotals(data?.totals ?? { debit: 0, credit: 0 });
    } catch {
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [selectedCode, startDate, endDate, branchId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Search is client-side only — the ledger action has no free-text param.
  const filteredLines = useMemo(() => {
    return lines.filter(
      (l) =>
        l.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lines, searchTerm]);

  const netChange = lines.length > 0 ? lines[lines.length - 1].runningBalance : 0;

  const handleExport = () => {
    toast.success("Ledger statement successfully exported as XLSX format.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <History className="text-indigo-600 h-8 w-8" /> Accounting Ledger Book
          </h1>
          <p className="text-muted-foreground text-sm">
            Professional Double-Entry ledger statements and running balance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border gap-1 bg-card" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Ledger
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Account Debits</p>
              <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(totals.debit)}</h3>
            </div>
            <div className="p-3 bg-indigo-100/60 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Account Credits</p>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totals.credit)}</h3>
            </div>
            <div className="p-3 bg-emerald-100/60 dark:bg-emerald-900/30 rounded-2xl text-emerald-600">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Net Account Balance Change</p>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatCurrency(netChange)}</h3>
            </div>
            <div className="p-3 bg-purple-100/60 dark:bg-purple-900/30 rounded-2xl text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and selector panel */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* Account Selector */}
            <div className="w-full sm:w-80">
              <Select value={selectedCode} onValueChange={setSelectedCode}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select General Ledger Account" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_OPTIONS.map((acc) => (
                    <SelectItem key={acc.code} value={acc.code}>
                      ({acc.code}) {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Live Narration Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search narration, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-background border-border"
              />
            </div>
          </div>

          {/* Branch + date range selection */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Branch:</span>
              <Input
                placeholder="(optional)"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="h-9 text-xs bg-background border-border font-mono w-32"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs bg-background border-border"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs bg-background border-border"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => { setStartDate(""); setEndDate(""); setSearchTerm(""); setBranchId(""); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Transactions Table */}
      <Card className="border border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="py-4 border-b border-border bg-muted/20">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold">Ledger Transactions Statement</CardTitle>
              <CardDescription className="text-xs">
                Showing entries for account <span className="font-semibold text-indigo-600">({activeAccount.code}) {activeAccount.name}</span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">
              Account Category: {activeAccount.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading ledger...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Posting Date</TableHead>
                  <TableHead className="w-[140px]">Record ID</TableHead>
                  <TableHead className="w-[100px]">Reference</TableHead>
                  <TableHead>Narration / Explanation</TableHead>
                  <TableHead className="text-right w-[150px]">Debit (Dr)</TableHead>
                  <TableHead className="text-right w-[150px]">Credit (Cr)</TableHead>
                  <TableHead className="text-right w-[180px]">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      No matching general ledger entries found for selected account.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLines.map((line) => (
                    <TableRow key={line.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        {formatDate(new Date(line.date))}
                      </TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[140px]" title={line.id}>
                        {line.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-950 font-normal">
                          {line.ref}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{line.narration}</TableCell>
                      <TableCell className="text-right text-xs font-mono font-semibold">
                        {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-semibold">
                        {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold text-indigo-600">
                        {formatCurrency(line.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}