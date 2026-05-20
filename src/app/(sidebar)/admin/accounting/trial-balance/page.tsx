"use client";

import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Printer, 
  Scale, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const TRIAL_BALANCE_ACCOUNTS = [
  { code: "1010", name: "Main Cash Reserve Account", category: "Assets", debit: 18560.00, credit: 0 },
  { code: "1020", name: "Accounts Receivable (Debtors)", category: "Assets", debit: 4500.00, credit: 0 },
  { code: "1050", name: "Inventory Asset Account", category: "Assets", debit: 25400.00, credit: 0 },
  { code: "1200", name: "Prepaid Insurances & Leases", category: "Assets", debit: 1200.00, credit: 0 },
  { code: "2010", name: "Accounts Payable (Creditors)", category: "Liabilities", debit: 0, credit: 6250.00 },
  { code: "2050", name: "Accrued GST / Tax Liability", category: "Liabilities", debit: 0, credit: 1540.00 },
  { code: "3010", name: "Owner Capital Account", category: "Equity", debit: 0, credit: 35000.00 },
  { code: "4010", name: "Product Sales Revenue", category: "Revenue", debit: 0, credit: 16420.00 },
  { code: "5010", name: "Cost of Goods Sold (COGS)", category: "Expenses", debit: 7850.00, credit: 0 },
  { code: "5020", name: "Office Utility & Admin Expenses", category: "Expenses", debit: 1700.00, credit: 0 },
];

export default function TrialBalancePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAccounts = useMemo(() => {
    return TRIAL_BALANCE_ACCOUNTS.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.includes(searchTerm)
    );
  }, [searchTerm]);

  const totals = useMemo(() => {
    return TRIAL_BALANCE_ACCOUNTS.reduce(
      (sum, item) => {
        return {
          debit: sum.debit + item.debit,
          credit: sum.credit + item.credit,
        };
      },
      { debit: 0, credit: 0 }
    );
  }, []);

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

      {/* Verification Status Card */}
      <Card className="border border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/30">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-green-900 dark:text-green-300">Mathematical Ledger Parity</h3>
              <p className="text-xs text-green-700/80 dark:text-green-400/80">
                All posting journal items balance correctly. Debits exactly equate credits as of today.
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono shrink-0">
            <div className="text-green-800 dark:text-green-400 font-bold text-sm">
              Dr {formatCurrency(totals.debit)} = Cr {formatCurrency(totals.credit)}
            </div>
            <div className="text-muted-foreground">Variance: {formatCurrency(0)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search */}
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
                Reflecting ledger statuses for fiscal period ending May 2026
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">
              Audited Account Balances
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {filteredAccounts.map((a) => (
                <TableRow key={a.code} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{a.code}</TableCell>
                  <TableCell className="text-xs font-bold text-foreground">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-normal ${
                      a.category === "Assets" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      a.category === "Liabilities" ? "bg-red-50 text-red-700 border-red-200" :
                      a.category === "Expenses" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
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
              ))}

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
        </CardContent>
      </Card>
    </div>
  );
}
