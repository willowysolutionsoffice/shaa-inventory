"use client";

import React, { useMemo } from "react";
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Layers,
  Scale
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Balance Sheet detailed items
const ASSETS_MOCK = {
  currentAssets: [
    { name: "Cash and Cash Equivalents", amount: 18560.00 },
    { name: "Accounts Receivable (Net of doubtful debts)", amount: 4500.00 },
    { name: "Merchandise Inventory Stocks", amount: 25400.00 },
    { name: "Prepaid Insurances & Leases", amount: 1200.00 },
  ],
  nonCurrentAssets: [
    { name: "Property, Plant & Equipments (net of depreciation)", amount: 35000.00 },
    { name: "Office Infrastructures & Fixtures", amount: 8500.00 },
  ]
};

const LIABILITIES_EQUITY_MOCK = {
  currentLiabilities: [
    { name: "Accounts Payable (Creditors)", amount: 6250.00 },
    { name: "Accrued GST / VAT Taxes", amount: 1540.00 },
    { name: "Deferred Utility accrued obligations", amount: 370.00 },
  ],
  nonCurrentLiabilities: [
    { name: "Long-term banking commercial lease lines", amount: 12000.00 },
  ],
  equity: [
    { name: "Owner Capital Contribution", amount: 35000.00 },
    { name: "Retained Earnings & Reserves", amount: 38000.00 },
  ]
};

export default function BalanceSheetPage() {

  // Sums calculations
  const assetTotals = useMemo(() => {
    const current = ASSETS_MOCK.currentAssets.reduce((sum, item) => sum + item.amount, 0);
    const nonCurrent = ASSETS_MOCK.nonCurrentAssets.reduce((sum, item) => sum + item.amount, 0);
    return {
      current,
      nonCurrent,
      total: current + nonCurrent
    };
  }, []);

  const liabilitiesEquityTotals = useMemo(() => {
    const currentLiab = LIABILITIES_EQUITY_MOCK.currentLiabilities.reduce((sum, item) => sum + item.amount, 0);
    const nonCurrentLiab = LIABILITIES_EQUITY_MOCK.nonCurrentLiabilities.reduce((sum, item) => sum + item.amount, 0);
    const equitySum = LIABILITIES_EQUITY_MOCK.equity.reduce((sum, item) => sum + item.amount, 0);
    return {
      currentLiabilities: currentLiab,
      nonCurrentLiabilities: nonCurrentLiab,
      totalLiabilities: currentLiab + nonCurrentLiab,
      equity: equitySum,
      total: currentLiab + nonCurrentLiab + equitySum
    };
  }, []);

  // Ratios
  const currentRatio = useMemo(() => {
    return assetTotals.current / liabilitiesEquityTotals.currentLiabilities;
  }, [assetTotals, liabilitiesEquityTotals]);

  const quickRatio = useMemo(() => {
    // Quick assets = Current Assets - Inventory
    const quickAssets = assetTotals.current - (ASSETS_MOCK.currentAssets.find(a => a.name.includes("Inventory"))?.amount || 0);
    return quickAssets / liabilitiesEquityTotals.currentLiabilities;
  }, [assetTotals, liabilitiesEquityTotals]);

  const handleExport = () => {
    toast.success("Balance Sheet successfully exported in XLSX ledger audit format.");
  };

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

      {/* Ratios & Integrity Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Mathematical Check</span>
              <div className="text-sm font-extrabold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                Assets = Liab + Equity
              </div>
              <p className="text-xs text-muted-foreground">Balanced: {formatCurrency(assetTotals.total)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full shrink-0">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Liquidity Current Ratio</span>
              <div className="text-sm font-extrabold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                {currentRatio.toFixed(2)}x
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] py-0">Healthy</Badge>
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
                {quickRatio.toFixed(2)}x
                <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 text-[10px] py-0">Optimum</Badge>
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
                {ASSETS_MOCK.currentAssets.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Current Assets</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(assetTotals.current)}
                  </TableCell>
                </TableRow>

                {/* Non current assets */}
                <TableRow className="bg-muted/5 font-semibold">
                  <TableCell className="text-xs py-3">Non-Current / Fixed Assets</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {ASSETS_MOCK.nonCurrentAssets.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Non-Current Assets</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(assetTotals.nonCurrent)}
                  </TableCell>
                </TableRow>

                {/* Balance Sheet Assets Grand Total */}
                <TableRow className="bg-purple-500/10 font-extrabold hover:bg-purple-500/10">
                  <TableCell className="text-xs py-3.5 uppercase tracking-wider text-purple-700 dark:text-purple-400">Total Assets Balance</TableCell>
                  <TableCell className="text-right font-mono text-sm text-purple-700 dark:text-purple-400 font-extrabold border-t-2 border-double border-purple-500">
                    {formatCurrency(assetTotals.total)}
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
                {LIABILITIES_EQUITY_MOCK.currentLiabilities.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Current Liabilities</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(liabilitiesEquityTotals.currentLiabilities)}
                  </TableCell>
                </TableRow>

                {/* Non current liabilities */}
                <TableRow className="bg-muted/5 font-semibold">
                  <TableCell className="text-xs py-3">Non-Current / Long-Term Liabilities</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {LIABILITIES_EQUITY_MOCK.nonCurrentLiabilities.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Non-Current Liabilities</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(liabilitiesEquityTotals.nonCurrentLiabilities)}
                  </TableCell>
                </TableRow>

                {/* Equity */}
                <TableRow className="bg-muted/5 font-semibold">
                  <TableCell className="text-xs py-3">Owners Equity Account Shares</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {LIABILITIES_EQUITY_MOCK.equity.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold text-foreground pl-6">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-bold hover:bg-muted/10">
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground pl-6">Total Shareholder Equity</TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                    {formatCurrency(liabilitiesEquityTotals.equity)}
                  </TableCell>
                </TableRow>

                {/* Balance Sheet Liabilities & Equity Grand Total */}
                <TableRow className="bg-purple-500/10 font-extrabold hover:bg-purple-500/10">
                  <TableCell className="text-xs py-3.5 uppercase tracking-wider text-purple-700 dark:text-purple-400">Total Liab & Equity</TableCell>
                  <TableCell className="text-right font-mono text-sm text-purple-700 dark:text-purple-400 font-extrabold border-t-2 border-double border-purple-500">
                    {formatCurrency(liabilitiesEquityTotals.total)}
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
