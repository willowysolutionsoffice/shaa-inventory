"use client";

import React, { useState, useMemo } from "react";
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

// Comprehensive mock data for ledgers
const LEDGER_ACCOUNTS = [
  { code: "1010", name: "Main Cash Reserve Account", category: "Assets" },
  { code: "1020", name: "Accounts Receivable (Customers)", category: "Assets" },
  { code: "2010", name: "Accounts Payable (Suppliers)", category: "Liabilities" },
  { code: "4010", name: "Sales Revenues Account", category: "Revenue" },
  { code: "5010", name: "Cost of Goods Sold (COGS)", category: "Expenses" },
  { code: "5020", name: "Office Expenses & Categories", category: "Expenses" },
];

const TRANSACTIONS_MOCK: Record<string, Array<{ id: string; date: string; ref: string; narration: string; debit: number; credit: number }>> = {
  "1010": [
    { id: "TX-901", date: "2026-05-01", ref: "SAL-01", narration: "Cash received from retail client checkout", debit: 1250.00, credit: 0 },
    { id: "TX-902", date: "2026-05-02", ref: "PUR-22", narration: "Paid supplier for inventory restocking", debit: 0, credit: 620.00 },
    { id: "TX-905", date: "2026-05-04", ref: "EXP-88", narration: "Office electricity bill payment", debit: 0, credit: 150.00 },
    { id: "TX-906", date: "2026-05-08", ref: "SAL-04", narration: "Received online card payment clearance", debit: 2450.00, credit: 0 },
    { id: "TX-909", date: "2026-05-15", ref: "EXP-90", narration: "Office high-speed internet subscription", debit: 0, credit: 80.00 },
    { id: "TX-910", date: "2026-05-18", ref: "SAL-09", narration: "Bulk orders partial payments", debit: 950.00, credit: 0 },
  ],
  "1020": [
    { id: "TX-901", date: "2026-05-01", ref: "SAL-01", narration: "Invoice generated for Elena", debit: 450.00, credit: 0 },
    { id: "TX-903", date: "2026-05-02", ref: "PAY-01", narration: "Partial balance cleared by Michael", debit: 0, credit: 200.00 },
    { id: "TX-904", date: "2026-05-03", ref: "SAL-02", narration: "Corporate credit terms invoice dispatched", debit: 1800.00, credit: 0 },
    { id: "TX-907", date: "2026-05-10", ref: "PAY-02", narration: "Outstanding invoice fully cleared", debit: 0, credit: 450.00 },
  ],
  "2010": [
    { id: "TX-902", date: "2026-05-02", ref: "PUR-22", narration: "Purchased raw materials from supplier", debit: 0, debit: 620.00, credit: 620.00 },
    { id: "TX-908", date: "2026-05-12", ref: "PAY-SUP-01", narration: "Cleared balance to supplier", debit: 350.00, credit: 0 },
  ],
  "4010": [
    { id: "TX-901", date: "2026-05-01", ref: "SAL-01", narration: "Product retail checkout revenues", debit: 0, credit: 1250.00 },
    { id: "TX-906", date: "2026-05-08", ref: "SAL-04", narration: "B2B client custom sales revenue", debit: 0, credit: 2450.00 },
    { id: "TX-910", date: "2026-05-18", ref: "SAL-09", narration: "Bulk corporate order revenues", debit: 0, credit: 950.00 },
  ],
  "5010": [
    { id: "TX-902", date: "2026-05-02", ref: "PUR-22", narration: "Procurement cost recognized for stock items", debit: 620.00, credit: 0 },
  ],
  "5020": [
    { id: "TX-905", date: "2026-05-04", ref: "EXP-88", narration: "Standard power/electricity utility bill", debit: 150.00, credit: 0 },
    { id: "TX-909", date: "2026-05-15", ref: "EXP-90", narration: "Internet fiber bandwidth connection costs", debit: 80.00, credit: 0 },
  ],
};

export default function LedgerPage() {
  const [selectedCode, setSelectedCode] = useState("1010");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const activeAccount = useMemo(() => {
    return LEDGER_ACCOUNTS.find((a) => a.code === selectedCode) || LEDGER_ACCOUNTS[0];
  }, [selectedCode]);

  // Compute ledger lines with running balance
  const ledgerLines = useMemo(() => {
    const rawLines = TRANSACTIONS_MOCK[selectedCode] || [];
    let currentBalance = 0;
    
    // Sort transactions chronologically
    const sortedLines = [...rawLines].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sortedLines.map((line) => {
      // Net change calculation depends on Account type (Assets/Expenses Debit increases balance; Liabilities/Equity Credit increases)
      const isDebitIncrease = activeAccount.category === "Assets" || activeAccount.category === "Expenses";
      if (isDebitIncrease) {
        currentBalance += (line.debit - line.credit);
      } else {
        currentBalance += (line.credit - line.debit);
      }

      return {
        ...line,
        runningBalance: currentBalance,
      };
    });
  }, [selectedCode, activeAccount]);

  // Filtered lines list
  const filteredLines = useMemo(() => {
    return ledgerLines.filter((l) => {
      const matchesSearch = l.narration.toLowerCase().includes(searchTerm.toLowerCase()) || l.ref.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStart = !startDate || new Date(l.date) >= new Date(startDate);
      const matchesEnd = !endDate || new Date(l.date) <= new Date(endDate);
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [ledgerLines, searchTerm, startDate, endDate]);

  const aggregates = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    filteredLines.forEach((l) => {
      totalDebit += l.debit;
      totalCredit += l.credit;
    });
    return {
      totalDebit,
      totalCredit,
      netChange: activeAccount.category === "Assets" || activeAccount.category === "Expenses" 
        ? totalDebit - totalCredit 
        : totalCredit - totalDebit
    };
  }, [filteredLines, activeAccount]);

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

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Account Debits</p>
              <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(aggregates.totalDebit)}</h3>
            </div>
            <div className="p-3 bg-indigo-100/60 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
              <ArrowDownLeft className="h-6 w-6 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Account Credits</p>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(aggregates.totalCredit)}</h3>
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
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatCurrency(aggregates.netChange)}</h3>
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
                  {LEDGER_ACCOUNTS.map((acc) => (
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

          {/* Date range selection */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
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
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => { setStartDate(""); setEndDate(""); setSearchTerm(""); }}>
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
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Posting Date</TableHead>
                <TableHead className="w-[120px]">Journal Voucher</TableHead>
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
                    <TableCell className="text-xs font-mono">{line.id}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
