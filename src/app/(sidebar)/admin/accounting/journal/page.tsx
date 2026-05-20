"use client";

import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Scale
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock accounts for journal entries
const MOCK_ACCOUNTS = [
  { code: "1010", name: "Main Cash Reserve Account" },
  { code: "1020", name: "Accounts Receivable" },
  { code: "2010", name: "Accounts Payable" },
  { code: "4010", name: "Sales Revenues Account" },
  { code: "5010", name: "Cost of Goods Sold (COGS)" },
  { code: "5020", name: "Office Expenses" },
];

const JOURNAL_ENTRIES_MOCK = [
  {
    id: "JV-2026-001",
    date: "2026-05-18",
    narration: "Acknowledge office rent utility payment allocation",
    status: "Posted",
    items: [
      { accountCode: "5020", accountName: "Office Expenses", debit: 500.00, credit: 0 },
      { accountCode: "1010", accountName: "Main Cash Reserve Account", debit: 0, credit: 500.00 },
    ],
  },
  {
    id: "JV-2026-002",
    date: "2026-05-19",
    narration: "Record corporate sale credit allocation adjustments",
    status: "Posted",
    items: [
      { accountCode: "1020", accountName: "Accounts Receivable", debit: 1200.00, credit: 0 },
      { accountCode: "4010", accountName: "Sales Revenues Account", debit: 0, credit: 1200.00 },
    ],
  },
  {
    id: "JV-2026-003",
    date: "2026-05-20",
    narration: "Netting outstanding raw material purchase accounts",
    status: "Draft",
    items: [
      { accountCode: "5010", accountName: "Cost of Goods Sold (COGS)", debit: 450.00, credit: 0 },
      { accountCode: "2010", accountName: "Accounts Payable", debit: 0, credit: 450.00 },
    ],
  },
];

interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export default function JournalPage() {
  const [entries, setEntries] = useState(JOURNAL_ENTRIES_MOCK);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form states for creating a new Journal Entry
  const [newNarration, setNewNarration] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newLines, setNewLines] = useState<JournalLine[]>([
    { accountCode: "5020", debit: 0, credit: 0 },
    { accountCode: "1010", debit: 0, credit: 0 },
  ]);

  // Compute double-entry balance validation
  const totals = useMemo(() => {
    return newLines.reduce(
      (sum, line) => {
        return {
          debit: sum.debit + (line.debit || 0),
          credit: sum.credit + (line.credit || 0),
        };
      },
      { debit: 0, credit: 0 }
    );
  }, [newLines]);

  const isBalanced = useMemo(() => {
    return totals.debit > 0 && totals.debit === totals.credit;
  }, [totals]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(
      (e) =>
        e.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);

  // Handle adding lines to JV form
  const addLine = () => {
    setNewLines([...newLines, { accountCode: "1010", debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (newLines.length <= 2) {
      toast.warning("A Journal Voucher must have at least 2 double-entry distribution lines.");
      return;
    }
    setNewLines(newLines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    setNewLines(
      newLines.map((line, idx) => {
        if (idx === index) {
          if (field === "debit") {
            return { ...line, debit: Number(value), credit: 0 }; // Debit resets Credit
          }
          if (field === "credit") {
            return { ...line, credit: Number(value), debit: 0 }; // Credit resets Debit
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const submitJournalEntry = () => {
    if (!newNarration.trim()) {
      toast.warning("Please provide a narration/explanation for this voucher.");
      return;
    }
    if (!isBalanced) {
      toast.error("Double Entry Unbalanced. Total Debits must exactly equal Total Credits.");
      return;
    }

    const compiledItems = newLines.map((line) => {
      const accName = MOCK_ACCOUNTS.find((a) => a.code === line.accountCode)?.name || "Unknown Account";
      return {
        accountCode: line.accountCode,
        accountName: accName,
        debit: line.debit,
        credit: line.credit,
      };
    });

    const newVoucher = {
      id: `JV-2026-${(entries.length + 1).toString().padStart(3, "0")}`,
      date: newDate,
      narration: newNarration,
      status: "Posted" as const,
      items: compiledItems,
    };

    setEntries([newVoucher, ...entries]);
    toast.success(`Journal Voucher ${newVoucher.id} posted successfully!`);
    
    // Reset Form
    setNewNarration("");
    setNewLines([
      { accountCode: "5020", debit: 0, credit: 0 },
      { accountCode: "1010", debit: 0, credit: 0 },
    ]);
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Scale className="text-purple-600 h-8 w-8 animate-spin-slow" /> Journal Vouchers (JV)
          </h1>
          <p className="text-muted-foreground text-sm">
            Record off-cycle adjustments, depreciation expenses, and custom general ledger distributions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-1 shadow-md shadow-purple-600/20">
              <Plus className="h-4 w-4" /> Create Journal Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">New Journal Entry Voucher</DialogTitle>
              <DialogDescription className="text-xs">
                Ensure debits exactly balance credits to preserve accounting integrity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Voucher Narration</span>
                  <Input
                    placeholder="Enter purpose or explanation of adjustment..."
                    value={newNarration}
                    onChange={(e) => setNewNarration(e.target.value)}
                    className="h-9 border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Posting Date</span>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-9 border-border bg-background text-xs"
                  />
                </div>
              </div>

              {/* Journal Voucher Distribution Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <span className="text-xs font-bold text-foreground">Distribution Account</span>
                  <div className="flex gap-24 pr-16 text-xs font-bold text-muted-foreground">
                    <span>Debit</span>
                    <span>Credit</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                  {newLines.map((line, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <Select
                          value={line.accountCode}
                          onValueChange={(val) => updateLine(index, "accountCode", val)}
                        >
                          <SelectTrigger className="h-9 bg-background border-border text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOCK_ACCOUNTS.map((a) => (
                              <SelectItem key={a.code} value={a.code} className="text-xs">
                                ({a.code}) {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Dr Amount"
                          value={line.debit || ""}
                          onChange={(e) => updateLine(index, "debit", e.target.value)}
                          className="h-9 text-xs border-border bg-background text-right font-mono"
                        />
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Cr Amount"
                          value={line.credit || ""}
                          onChange={(e) => updateLine(index, "credit", e.target.value)}
                          className="h-9 text-xs border-border bg-background text-right font-mono"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="h-8 text-xs border-dashed gap-1" onClick={addLine}>
                  <Plus className="h-3 w-3" /> Add Account Distribution Line
                </Button>
              </div>

              {/* Real-time Double Entry Validation Box */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                isBalanced 
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300"
              }`}>
                <div className="flex items-center gap-1.5">
                  {isBalanced ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span>
                    {isBalanced 
                      ? "Double-entry rules satisfied. Voucher in absolute balance." 
                      : `Double-entry unbalanced. Difference: ${formatCurrency(Math.abs(totals.debit - totals.credit))}`}
                  </span>
                </div>
                <div className="font-mono text-right">
                  <div>Dr Total: {formatCurrency(totals.debit)}</div>
                  <div>Cr Total: {formatCurrency(totals.credit)}</div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="border-border text-xs h-9" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 shadow-md"
                disabled={!isBalanced}
                onClick={submitJournalEntry}
              >
                Post Ledger Adjustments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search general ledger JVs by narration, voucher code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-background border-border h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Journal entries cards/list */}
      <div className="space-y-4">
        {filteredEntries.map((jv) => (
          <Card key={jv.id} className="border border-border bg-card shadow-sm hover:border-purple-500/50 transition-all overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-400">{jv.id}</span>
                <Badge className={jv.status === "Posted" ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400"}>
                  {jv.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(new Date(jv.date))}</span>
              </div>
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <span>Balanced: </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(jv.items.reduce((sum, item) => sum + item.debit, 0))}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 text-xs font-semibold text-muted-foreground italic border-b border-border bg-muted/5">
                Narration: &ldquo;{jv.narration}&rdquo;
              </div>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] py-2">General Ledger Code</TableHead>
                    <TableHead className="py-2">Distribution Account</TableHead>
                    <TableHead className="text-right w-[150px] py-2">Debit (Dr)</TableHead>
                    <TableHead className="text-right w-[150px] py-2">Credit (Cr)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jv.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/10">
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.accountCode}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground">{item.accountName}</TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold">
                        {item.debit > 0 ? formatCurrency(item.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold">
                        {item.credit > 0 ? formatCurrency(item.credit) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
