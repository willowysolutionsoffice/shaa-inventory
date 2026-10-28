"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface CreditNotesTableProps {
  salesReturns: any[];
  purchaseReturns: any[];
}

export function CreditNotesTable({
  salesReturns,
  purchaseReturns,
}: CreditNotesTableProps) {
  const [activeType, setActiveType] = useState<"all" | "credit" | "debit">("all");
  const [search, setSearch] = useState("");

  // Map Sales Returns into Customer Credit Notes
  const creditNotes = useMemo(() => {
    return salesReturns.map((r) => {
      const isCredit = String(r.refundMethod ?? "").toLowerCase() === "credit";
      return {
        id: r.id,
        refNo: r.returnNo || `CN-${r.id.slice(0, 8)}`,
        type: "Credit Note",
        invoiceNo: r.sale?.invoiceNo || "—",
        date: r.returnDate || r.createdAt,
        party: r.customer?.name || "Walk-in",
        branch: r.branch?.name || "SHAASHOPY CHEMMAD",
        status: isCredit ? "Store Credit" : "Refund Dispatched",
        amount: Number(r.grandTotal || 0),
        rawType: "credit",
      };
    });
  }, [salesReturns]);

  // Map Purchase Returns into Supplier Debit Notes
  const debitNotes = useMemo(() => {
    return purchaseReturns.map((pr) => {
      return {
        id: pr.id,
        refNo: pr.returnNo || pr.referenceNo || `DN-${pr.id.slice(0, 8)}`,
        type: "Debit Note",
        invoiceNo: pr.purchase?.purchaseNo || pr.purchaseId || "—",
        date: pr.returnDate || pr.createdAt,
        party: pr.supplier?.name || "Supplier",
        branch: pr.branch?.name || "SHAASHOPY CHEMMAD",
        status: "Supplier Account Debited",
        amount: Number(pr.totalAmount || 0),
        rawType: "debit",
      };
    });
  }, [purchaseReturns]);

  const allNotes = useMemo(() => {
    return [...creditNotes, ...debitNotes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [creditNotes, debitNotes]);

  const filteredNotes = useMemo(() => {
    let list = allNotes;
    if (activeType === "credit") {
      list = allNotes.filter((n) => n.rawType === "credit");
    } else if (activeType === "debit") {
      list = allNotes.filter((n) => n.rawType === "debit");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.refNo.toLowerCase().includes(q) ||
          n.invoiceNo.toLowerCase().includes(q) ||
          n.party.toLowerCase().includes(q) ||
          n.branch.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNotes, activeType, search]);

  const totalAmount = useMemo(() => {
    return filteredNotes.reduce((sum, n) => sum + n.amount, 0);
  }, [filteredNotes]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <CardTitle>Credit &amp; Debit Notes</CardTitle>
          <CardDescription>
            A list of all customer credit notes and supplier debit notes
          </CardDescription>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Uniform filter pills */}
          <div className="inline-flex p-1 bg-muted rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveType("all")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeType === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({allNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveType("credit")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeType === "credit"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Credit Notes ({creditNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveType("debit")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeType === "debit"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Debit Notes ({debitNotes.length})
            </button>
          </div>

          {/* Search box matching standard table search */}
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by Ref, Invoice, Party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Note Ref
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Type
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Sale / Purchase Ref
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Date &amp; Time
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Party (Customer / Supplier)
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Branch
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs">
                Accounting Status
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground font-semibold text-xs text-right">
                Total Amount
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredNotes.length ? (
              filteredNotes.map((n) => (
                <TableRow key={`${n.rawType}-${n.id}`} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold">
                    {n.refNo}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${
                        n.rawType === "credit"
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {n.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {n.invoiceNo}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {n.date ? formatDateTime(n.date) : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {n.party}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {n.branch}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="capitalize">{n.status}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs">
                    {formatCurrency(n.amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm">
                  No credit or debit notes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter className="bg-muted/50 border-t text-sm font-medium">
            <TableRow>
              <TableCell colSpan={7} className="text-right font-semibold">
                Total Amount:
              </TableCell>
              <TableCell className="text-right font-bold text-foreground">
                {formatCurrency(totalAmount)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

