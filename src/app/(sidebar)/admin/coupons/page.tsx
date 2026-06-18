"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Ticket,
  Copy,
  Users,
  Loader2,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  createCoupon,
  getCouponList,
  disableCoupon,
  deleteCoupon,
} from "@/actions/coupon-action";
import { getBranchListForDropdown, type BranchDropdownItem } from "@/actions/branch-action";

// ── Types ──────────────────────────────────────────────────────────────────────

type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED";
type CouponType   = "PERCENTAGE" | "FIXED_AMOUNT";

interface Coupon {
  id:              string;
  code:            string;
  description:     string | null;
  type:            CouponType;
  value:           number;
  minCartValue:    number;
  startDate:       string;
  endDate:         string;
  status:          CouponStatus;
  branchId:        string;
  branch?:         { id: string; name: string };
  redemptionCount: number;
}

interface CouponMetadata {
  totalCount:  number;
  totalPages:  number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extract<T>(result: { data?: { data?: T; error?: string } } | undefined): { data?: T; error?: string } {
  return { data: result?.data?.data, error: result?.data?.error };
}

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<CouponStatus, string> = {
  ACTIVE:   "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400",
  EXPIRED:  "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400",
  DISABLED: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons]           = useState<Coupon[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionId, setActionId]         = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "ALL">("ALL");
  const [page, setPage]                 = useState(1);
  const [metadata, setMetadata]         = useState<CouponMetadata | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Branch dropdown
  const [branches, setBranches]               = useState<BranchDropdownItem[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  // Form state
  const [newCode,   setNewCode]   = useState("");
  const [newDesc,   setNewDesc]   = useState("");
  const [newType,   setNewType]   = useState<CouponType>("PERCENTAGE");
  const [newValue,  setNewValue]  = useState("");
  const [newMin,    setNewMin]    = useState("50");
  const [newStart,  setNewStart]  = useState(new Date().toISOString().split("T")[0]);
  const [newEnd,    setNewEnd]    = useState("");
  const [newBranch, setNewBranch] = useState("");

  // ── Load branches once on mount ─────────────────────────────────────────────

  useEffect(() => {
    getBranchListForDropdown()
      .then((data) => {
        setBranches(data);
        if (data.length > 0) setNewBranch(data[0].id);
      })
      .catch(() => toast.error("Failed to load branches"))
      .finally(() => setBranchesLoading(false));
  }, []);

  // ── Load coupons ────────────────────────────────────────────────────────────

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCouponList({
        page,
        limit:  PAGE_SIZE,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      const { data, error } = extract<{ coupons: Coupon[]; metadata: CouponMetadata }>(result);
      if (error) { toast.error(error); return; }
      setCoupons(data?.coupons ?? []);
      setMetadata(data?.metadata ?? null);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  // ── Derived stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    active:      coupons.filter((c) => c.status === "ACTIVE").length,
    redemptions: coupons.reduce((sum, c) => sum + c.redemptionCount, 0),
  }), [coupons]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setNewCode(""); setNewDesc(""); setNewValue("");
    setNewMin("50"); setNewEnd(""); setNewType("PERCENTAGE");
    setNewStart(new Date().toISOString().split("T")[0]);
    setNewBranch(branches[0]?.id ?? "");
  };

  const handleCreate = async () => {
    if (!newCode.trim())                    { toast.warning("Please provide a coupon code.");    return; }
    if (!newValue || Number(newValue) <= 0) { toast.warning("Discount value must be positive."); return; }
    if (!newEnd)                            { toast.warning("Please set an expiry date.");        return; }
    if (!newBranch)                         { toast.warning("Please select a branch.");           return; }
    if (newType === "PERCENTAGE" && Number(newValue) > 100) {
      toast.warning("Percentage discount cannot exceed 100%.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCoupon({
        code:         newCode,
        description:  newDesc || undefined,
        type:         newType,
        value:        Number(newValue),
        minCartValue: Number(newMin) || 0,
        startDate:    newStart,
        endDate:      newEnd,
        branchId:     newBranch,
      });
      const { data, error } = extract<Coupon>(result);
      if (error) { toast.error(error); return; }
      toast.success(`Coupon ${data?.code} created successfully!`);
      resetForm();
      setDialogOpen(false);
      setPage(1);
      loadCoupons();
    } catch {
      toast.error("Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (id: string, code: string) => {
    if (!window.confirm(`Disable coupon ${code}? It will no longer be usable at checkout.`)) return;
    setActionId(id);
    try {
      const result = await disableCoupon({ id });
      const { error } = extract<Coupon>(result);
      if (error) { toast.error(error); return; }
      toast.success(`Coupon ${code} disabled.`);
      loadCoupons();
    } catch {
      toast.error("Failed to disable coupon");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Permanently delete coupon ${code}? This only works if it has never been redeemed.`)) return;
    setActionId(id);
    try {
      const result = await deleteCoupon({ id });
      const { error } = extract<Coupon>(result);
      if (error) { toast.error(error); return; }
      toast.success(`Coupon ${code} deleted.`);
      loadCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setActionId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Ticket className="text-purple-600 h-8 w-8" /> Coupons & Offers
          </h1>
          <p className="text-muted-foreground text-sm">
            Launch seasonal promotional codes, customer credits, and flat discounts to boost retail sales
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-1 shadow-md shadow-purple-600/20">
              <Plus className="h-4 w-4" /> Create Coupon Promo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">New Coupon Offer Form</DialogTitle>
              <DialogDescription className="text-xs">
                Provide codes that clients can enter at the POS billing terminal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Promo Code (e.g. SUMMER50)</span>
                <Input
                  placeholder="Type alphanumeric discount code..."
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="h-9 border-border bg-background uppercase font-bold"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Public Description</span>
                <Input
                  placeholder="Flat 15% off high stock summer outfits..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="h-9 border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Discount Type</span>
                  <Select value={newType} onValueChange={(v) => setNewType(v as CouponType)}>
                    <SelectTrigger className="h-9 border-border bg-background text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE"   className="text-xs">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT" className="text-xs">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">
                    Value {newType === "PERCENTAGE" ? "(%)" : "(₹)"}
                  </span>
                  <Input
                    type="number"
                    placeholder={newType === "PERCENTAGE" ? "e.g. 10" : "e.g. 50"}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="h-9 border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Min Cart Value (₹)</span>
                  <Input
                    type="number"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value)}
                    className="h-9 border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Expiry Date</span>
                  <Input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="h-9 border-border bg-background text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Start Date</span>
                  <Input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="h-9 border-border bg-background text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Branch</span>
                  <Select value={newBranch} onValueChange={setNewBranch} disabled={branchesLoading}>
                    <SelectTrigger className="h-9 border-border bg-background text-xs">
                      {branchesLoading
                        ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</span>
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
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="border-border text-xs h-9" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 shadow-md"
                disabled={submitting || branchesLoading}
                onClick={handleCreate}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Launch Coupon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Coupons</span>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.active}</h3>
              <p className="text-[10px] text-muted-foreground">Available on Active POS Terminal</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Redemptions Tracked</span>
              <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{stats.redemptions}</h3>
              <p className="text-[10px] text-muted-foreground">Total Customer Utilizations</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Optimum Sales Conversion</span>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">88.5%</h3>
              <p className="text-[10px] text-muted-foreground">Average retention rate clearance</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-8 bg-background border-border h-9 text-xs"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as CouponStatus | "ALL"); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-full sm:w-40 bg-background border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL"      className="text-xs">All statuses</SelectItem>
              <SelectItem value="ACTIVE"   className="text-xs">Active</SelectItem>
              <SelectItem value="EXPIRED"  className="text-xs">Expired</SelectItem>
              <SelectItem value="DISABLED" className="text-xs">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading coupons...
        </div>
      ) : coupons.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No coupons found for this view.
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="py-4 border-b border-border bg-muted/20">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-bold">Store Coupons</CardTitle>
                <CardDescription className="text-xs">
                  Copy coupon codes to utilize in active checkouts and invoices
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">
                Store Clearance Codes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[160px]">Promotional Code</TableHead>
                  <TableHead>Offers & Explanations</TableHead>
                  <TableHead className="w-[120px]">Discount</TableHead>
                  <TableHead className="text-right w-[150px]">Min Purchase</TableHead>
                  <TableHead className="text-center w-[110px]">Redemptions</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[110px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-bold text-purple-600 py-4">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 shrink-0" />
                        <span>{c.code}</span>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="text-muted-foreground hover:text-purple-600 transition-colors p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold">{c.description ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.startDate.slice(0, 10)} → {c.endDate.slice(0, 10)}
                        {c.branch?.name && <span className="ml-1">· {c.branch.name}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-xs">
                      {c.type === "PERCENTAGE"
                        ? `${c.value}% off`
                        : `${formatCurrency(c.value)} flat`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {formatCurrency(c.minCartValue)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-indigo-600">
                      {c.redemptionCount}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[c.status]}>
                        {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                            disabled={actionId === c.id}
                            onClick={() => handleDisable(c.id, c.code)}
                            title="Disable coupon"
                          >
                            {actionId === c.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Ban className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {c.redemptionCount === 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            disabled={actionId === c.id}
                            onClick={() => handleDelete(c.id, c.code)}
                            title="Delete coupon (no redemptions)"
                          >
                            {actionId === c.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {metadata && (metadata.hasNextPage || metadata.hasPrevPage) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{metadata.totalCount} total coupon{metadata.totalCount === 1 ? "" : "s"}</span>
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