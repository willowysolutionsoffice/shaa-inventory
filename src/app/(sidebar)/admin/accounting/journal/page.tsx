"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Loader2,
  Undo2,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createJournal,
  getJournalList,
  postJournal,
  reverseJournal,
  deleteJournal,
} from "@/actions/journal-action";
import { getBranchListForDropdown, type BranchDropdownItem } from "@/actions/branch-action";

// ── Types ──────────────────────────────────────────────────────────────────────

type JournalStatus = "DRAFT" | "POSTED" | "REVERSED";

interface JournalLine {
  id?: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface JournalVoucher {
  id: string;
  voucherNo: string;
  date: string;
  narration: string;
  status: JournalStatus;
  branchId: string;
  branch?: { id: string; name: string };
  lines: JournalLine[];
}

interface JournalMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// next-safe-action wraps whatever the action handler returns inside `data`.
// Our handlers return either { data } or { error }, so unwrap both layers here.
function extract<T>(result: { data?: { data?: T; error?: string } } | undefined): { data?: T; error?: string } {
  return { data: result?.data?.data, error: result?.data?.error };
}

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<JournalStatus, string> = {
  DRAFT:    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400",
  POSTED:   "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400",
  REVERSED: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:text-zinc-400",
};

interface JournalLineForm {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

const emptyLines = (): JournalLineForm[] => [
  { accountCode: "", accountName: "", debit: 0, credit: 0 },
  { accountCode: "", accountName: "", debit: 0, credit: 0 },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries]           = useState<JournalVoucher[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionId, setActionId]         = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<JournalStatus | "ALL">("ALL");
  const [page, setPage]                 = useState(1);
  const [metadata, setMetadata]         = useState<JournalMetadata | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Branch dropdown
  const [branches, setBranches]               = useState<BranchDropdownItem[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  // Form state
  const [newBranchId,   setNewBranchId]   = useState("");
  const [newNarration,  setNewNarration]  = useState("");
  const [newDate,       setNewDate]       = useState(new Date().toISOString().split("T")[0]);
  const [newLines,      setNewLines]      = useState<JournalLineForm[]>(emptyLines());

  // ── Load branches once on mount ─────────────────────────────────────────────

  useEffect(() => {
    getBranchListForDropdown()
      .then((data) => {
        setBranches(data);
        if (data.length > 0) setNewBranchId(data[0].id);
      })
      .catch(() => toast.error("Failed to load branches"))
      .finally(() => setBranchesLoading(false));
  }, []);

  // ── Load journal vouchers ───────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getJournalList({
        page,
        limit:  PAGE_SIZE,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      const { data, error } = extract<{ vouchers: JournalVoucher[]; metadata: JournalMetadata }>(result);
      if (error) { toast.error(error); return; }
      setEntries(data?.vouchers ?? []);
      setMetadata(data?.metadata ?? null);
    } catch {
      toast.error("Failed to load journal vouchers");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Balance validation ──────────────────────────────────────────────────────

  const totals = useMemo(() => newLines.reduce(
    (sum, line) => ({ debit: sum.debit + (line.debit || 0), credit: sum.credit + (line.credit || 0) }),
    { debit: 0, credit: 0 }
  ), [newLines]);

  const isBalanced = useMemo(() => totals.debit > 0 && totals.debit === totals.credit, [totals]);

  const filteredEntries = useMemo(() => entries.filter(
    (e) =>
      e.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase())
  ), [entries, searchTerm]);

  // ── Line helpers ────────────────────────────────────────────────────────────

  const addLine = () => setNewLines([...newLines, { accountCode: "", accountName: "", debit: 0, credit: 0 }]);

  const removeLine = (index: number) => {
    if (newLines.length <= 2) {
      toast.warning("A Journal Voucher must have at least 2 double-entry distribution lines.");
      return;
    }
    setNewLines(newLines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, field: keyof JournalLineForm, value: any) => {
    setNewLines(newLines.map((line, idx) => {
      if (idx !== index) return line;
      if (field === "debit")  return { ...line, debit:  Number(value), credit: 0 };
      if (field === "credit") return { ...line, credit: Number(value), debit:  0 };
      return { ...line, [field]: value };
    }));
  };

  const resetForm = () => {
    setNewNarration("");
    setNewBranchId(branches[0]?.id ?? "");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewLines(emptyLines());
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const submitJournalEntry = async () => {
    if (!newNarration.trim()) { toast.warning("Please provide a narration/explanation for this voucher."); return; }
    if (!newBranchId)         { toast.warning("Please select a branch.");                                  return; }
    if (newLines.some((l) => !l.accountCode.trim() || !l.accountName.trim())) {
      toast.warning("Every line needs an account code and account name.");
      return;
    }
    if (!isBalanced) {
      toast.error("Double Entry Unbalanced. Total Debits must exactly equal Total Credits.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createJournal({
        narration: newNarration.trim(),
        date:      newDate,
        branchId:  newBranchId,
        lines:     newLines.map((l) => ({
          accountCode: l.accountCode.trim(),
          accountName: l.accountName.trim(),
          debit:       l.debit,
          credit:      l.credit,
        })),
      });
      const { data, error } = extract<JournalVoucher>(result);
      if (error) { toast.error(error); return; }
      toast.success(`Journal Voucher ${data?.voucherNo} created as Draft.`);
      resetForm();
      setDialogOpen(false);
      setPage(1);
      loadEntries();
    } catch {
      toast.error("Failed to create journal voucher");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePost = async (id: string) => {
    setActionId(id);
    try {
      const result = await postJournal({ id });
      const { data, error } = extract<JournalVoucher>(result);
      if (error) { toast.error(error); return; }
      toast.success(`${data?.voucherNo} posted.`);
      loadEntries();
    } catch {
      toast.error("Failed to post voucher");
    } finally {
      setActionId(null);
    }
  };

  const handleReverse = async (id: string) => {
    if (!window.confirm("Reverse this voucher? This creates a mirrored entry with debits and credits swapped.")) return;
    setActionId(id);
    try {
      const result = await reverseJournal({ id });
      const { data, error } = extract<JournalVoucher>(result);
      if (error) { toast.error(error); return; }
      toast.success(`Reversal voucher ${data?.voucherNo} created.`);
      loadEntries();
    } catch {
      toast.error("Failed to reverse voucher");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, voucherNo: string) => {
    if (!window.confirm(`Delete draft voucher ${voucherNo}? This cannot be undone.`)) return;
    setActionId(id);
    try {
      const result = await deleteJournal({ id });
      const { error } = extract<JournalVoucher>(result);
      if (error) { toast.error(error); return; }
      toast.success(`${voucherNo} deleted.`);
      loadEntries();
    } catch {
      toast.error("Failed to delete voucher");
    } finally {
      setActionId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Scale className="text-purple-600 h-8 w-8" /> Journal Vouchers (JV)
          </h1>
          <p className="text-muted-foreground text-sm">
            Record off-cycle adjustments, depreciation expenses, and custom general ledger distributions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-1 shadow-md shadow-purple-600/20">
              <Plus className="h-4 w-4" /> Create Journal Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">New Journal Entry Voucher</DialogTitle>
              <DialogDescription className="text-xs">
                Vouchers are created as Draft. Ensure debits exactly balance credits, then post separately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Narration + Date + Branch */}
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

              {/* Branch dropdown — replaces the raw Branch ID input */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Branch</span>
                <Select value={newBranchId} onValueChange={setNewBranchId} disabled={branchesLoading}>
                  <SelectTrigger className="h-9 border-border bg-background text-xs">
                    {branchesLoading
                      ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading branches...</span>
                      : <SelectValue placeholder="Select branch" />
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distribution Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <span className="text-xs font-bold text-foreground">Distribution Account</span>
                  <div className="flex gap-24 pr-16 text-xs font-bold text-muted-foreground">
                    <span>Debit</span>
                    <span>Credit</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar">
                  {newLines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="w-28">
                        <Input
                          placeholder="Code"
                          value={line.accountCode}
                          onChange={(e) => updateLine(index, "accountCode", e.target.value)}
                          className="h-9 text-xs border-border bg-background font-mono"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Account name"
                          value={line.accountName}
                          onChange={(e) => updateLine(index, "accountName", e.target.value)}
                          className="h-9 text-xs border-border bg-background"
                        />
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

              {/* Real-time Double Entry Validation */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                isBalanced
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300"
              }`}>
                <div className="flex items-center gap-1.5">
                  {isBalanced
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <AlertTriangle className="h-4 w-4 text-red-600" />
                  }
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
                disabled={!isBalanced || submitting || branchesLoading}
                onClick={submitJournalEntry}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search loaded JVs by narration, voucher number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-background border-border h-9 text-xs"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => { setStatusFilter(val as JournalStatus | "ALL"); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-full sm:w-40 bg-background border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL"      className="text-xs">All statuses</SelectItem>
              <SelectItem value="DRAFT"    className="text-xs">Draft</SelectItem>
              <SelectItem value="POSTED"   className="text-xs">Posted</SelectItem>
              <SelectItem value="REVERSED" className="text-xs">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Journal entries list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading journal vouchers...
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No journal vouchers found for this view.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((jv) => (
            <Card key={jv.id} className="border border-border bg-card shadow-sm hover:border-purple-500/50 transition-all overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border flex flex-row items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-400">{jv.voucherNo}</span>
                  <Badge className={STATUS_STYLES[jv.status]}>
                    {jv.status.charAt(0) + jv.status.slice(1).toLowerCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(new Date(jv.date))}</span>
                  {jv.branch?.name && <span className="text-xs text-muted-foreground">· {jv.branch.name}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span>Balanced: </span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(jv.lines.reduce((sum, line) => sum + (line.debit || 0), 0))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {jv.status === "DRAFT" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={actionId === jv.id}
                          onClick={() => handlePost(jv.id)}
                        >
                          {actionId === jv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Post
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-red-500 gap-1"
                          disabled={actionId === jv.id}
                          onClick={() => handleDelete(jv.id, jv.voucherNo)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </>
                    )}
                    {jv.status === "POSTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={actionId === jv.id}
                        onClick={() => handleReverse(jv.id)}
                      >
                        {actionId === jv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />} Reverse
                      </Button>
                    )}
                  </div>
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
                    {jv.lines.map((line) => (
                      <TableRow key={line.id ?? `${jv.id}-${line.accountCode}`} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs text-muted-foreground">{line.accountCode}</TableCell>
                        <TableCell className="text-xs font-medium text-foreground">{line.accountName}</TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold">
                          {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold">
                          {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {metadata && (metadata.hasNextPage || metadata.hasPrevPage) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{metadata.totalCount} total voucher{metadata.totalCount === 1 ? "" : "s"}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={!metadata.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={!metadata.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}