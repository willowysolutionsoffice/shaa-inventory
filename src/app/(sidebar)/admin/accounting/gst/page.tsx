"use client";

import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  TrendingUp, 
  FileCheck, 
  Layers, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// GST Summary Mock
const GST_TAX_BREAKDOWN = [
  { taxCode: "GST-5", description: "Standard essentials (5%)", rate: 5, purchasesAmt: 12400.00, purchaseTaxPaid: 620.00, salesAmt: 15400.00, salesTaxCollected: 770.00 },
  { taxCode: "GST-12", description: "General business supplies (12%)", rate: 12, purchasesAmt: 8500.00, purchaseTaxPaid: 1020.00, salesAmt: 11200.00, salesTaxCollected: 1344.00 },
  { taxCode: "GST-18", description: "Electronics and luxury (18%)", rate: 18, purchasesAmt: 15200.00, purchaseTaxPaid: 2736.00, salesAmt: 22450.00, salesTaxCollected: 4041.00 },
];

export default function GstVatReportPage() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q1-2026");

  // Sum aggregates
  const aggregates = useMemo(() => {
    let totalPurchasesAmt = 0;
    let totalInputTaxCredit = 0;
    let totalSalesAmt = 0;
    let totalOutputTax = 0;

    GST_TAX_BREAKDOWN.forEach((item) => {
      totalPurchasesAmt += item.purchasesAmt;
      totalInputTaxCredit += item.purchaseTaxPaid;
      totalSalesAmt += item.salesAmt;
      totalOutputTax += item.salesTaxCollected;
    });

    const netTaxPayable = totalOutputTax - totalInputTaxCredit;

    return {
      totalPurchasesAmt,
      totalInputTaxCredit,
      totalSalesAmt,
      totalOutputTax,
      netTaxPayable
    };
  }, []);

  const handleExport = () => {
    toast.success("GST/VAT Audit log sheet exported as CSV successfully.");
  };

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

      {/* Tax Aggregates KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Input Tax Credit (ITC)</span>
              <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(aggregates.totalInputTaxCredit)}</h3>
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
              <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400">{formatCurrency(aggregates.totalOutputTax)}</h3>
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
              <h3 className={`text-2xl font-bold ${aggregates.netTaxPayable >= 0 ? "text-purple-700 dark:text-purple-400" : "text-green-700"}`}>
                {formatCurrency(aggregates.netTaxPayable)}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {aggregates.netTaxPayable >= 0 ? "Balance payable to Authority" : "Tax credit offset carry forward"}
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
              Period: {selectedQuarter}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {GST_TAX_BREAKDOWN.map((item) => {
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
                  {formatCurrency(aggregates.totalPurchasesAmt)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-indigo-600 font-extrabold border-t border-border">
                  {formatCurrency(aggregates.totalInputTaxCredit)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-foreground font-extrabold border-t border-border">
                  {formatCurrency(aggregates.totalSalesAmt)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-amber-600 font-extrabold border-t border-border">
                  {formatCurrency(aggregates.totalOutputTax)}
                </TableCell>
                <TableCell className={`text-right font-mono text-xs font-extrabold border-t-2 border-double border-purple-500 ${aggregates.netTaxPayable >= 0 ? "text-purple-600" : "text-green-600"}`}>
                  {formatCurrency(aggregates.netTaxPayable)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
