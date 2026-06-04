"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import {
  Receipt, Search, Download, Eye, Printer,
  TrendingUp, IndianRupee, Clock, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, Calendar,
  Filter, RefreshCw, ArrowUpDown, ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getSalesList } from "@/actions/sales-action";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

type PaymentStatus = "paid" | "partial" | "due";

interface SaleRow {
  id: string;
  invoiceNo: string;
  salesdate: Date | string;
  grandTotal: number;
  paymentDue: number;
  paymentStatus: string;
  customer: { name: string };
  branch: { name: string };
  items: { quantity: number }[];
  payments: { paymentMethod: string; amount: number }[];
}

interface Meta {
  totalPages: number;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Totals {
  grandTotal: number;
  dueAmount: number;
  paidAmount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const toNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};
const fmtDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year:   "numeric",
    month:  "short",
    day:    "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(d);
};

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paid:    { label: "Paid",    color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle2 size={11} /> },
  partial: { label: "Partial", color: "#d97706", bg: "#fffbeb", icon: <Clock size={11} /> },
  due:     { label: "Due",     color: "#dc2626", bg: "#fef2f2", icon: <AlertCircle size={11} /> },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const router = useRouter();

  const [sales, setSales]         = useState<SaleRow[]>([]);
  const [meta, setMeta]           = useState<Meta | null>(null);
  const [totals, setTotals]       = useState<Totals | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");

  const LIMIT = 10;

  const fetchSales = () => {
    startTransition(async () => {
      const result = await getSalesList({
        page,
        limit: LIMIT,
        from: dateFrom || undefined,
        to:   dateTo   || undefined,
      });
      if (result?.data) {
        setSales(result.data.sales as SaleRow[]);
        setMeta(result.data.metadata);
        setTotals(result.data.totals);
      } else {
        toast.error("Failed to load invoices.");
      }
    });
  };

  useEffect(() => { fetchSales(); }, [page, dateFrom, dateTo]);

  // Client-side filter + sort
  const displayed = useMemo(() => {
    let rows = [...sales];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.invoiceNo.toLowerCase().includes(q) ||
          s.customer.name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      rows = rows.filter((s) => s.paymentStatus === statusFilter);
    }
    rows.sort((a, b) => {
      const diff = new Date(a.salesdate).getTime() - new Date(b.salesdate).getTime();
      return sortDir === "desc" ? -diff : diff;
    });
    return rows;
  }, [sales, search, statusFilter, sortDir]);

  const statCards = totals
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(totals.grandTotal),
          icon: <TrendingUp size={18} className="text-purple-600" />,
          bg: "bg-purple-50 dark:bg-purple-950/20",
          border: "border-purple-100 dark:border-purple-900/30",
        },
        {
          label: "Amount Collected",
          value: formatCurrency(totals.paidAmount),
          icon: <CheckCircle2 size={18} className="text-green-600" />,
          bg: "bg-green-50 dark:bg-green-950/20",
          border: "border-green-100 dark:border-green-900/30",
        },
        {
          label: "Outstanding Due",
          value: formatCurrency(totals.dueAmount),
          icon: <AlertCircle size={18} className="text-red-500" />,
          bg: "bg-red-50 dark:bg-red-950/20",
          border: "border-red-100 dark:border-red-900/30",
        },
        {
          label: "Total Invoices",
          value: meta?.totalCount ?? "—",
          icon: <Receipt size={18} className="text-blue-600" />,
          bg: "bg-blue-50 dark:bg-blue-950/20",
          border: "border-blue-100 dark:border-blue-900/30",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Receipt className="text-purple-600 h-8 w-8" /> Invoices
          </h1>
          <p className="text-muted-foreground text-sm">
            All sales invoices • filter, search, and manage
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            className="gap-1.5 h-9"
            onClick={fetchSales}
            disabled={isPending}
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-9 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => router.push("/sales/pos")}
          >
            <ShoppingBag size={14} /> New Sale
          </Button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className={`${card.bg} ${card.border} border shadow-sm`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 shadow-sm">
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-lg font-extrabold text-foreground leading-tight">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice no. or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/30"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 bg-muted/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="due">Due</SelectItem>
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-9 w-36 bg-muted/30 text-xs"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-9 w-36 bg-muted/30 text-xs"
              />
            </div>

            {/* Sort toggle */}
            <Button
              variant="outline" size="sm"
              className="h-9 gap-1.5 whitespace-nowrap"
              onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
            >
              <ArrowUpDown size={13} />
              {sortDir === "desc" ? "Newest first" : "Oldest first"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card className="border-border shadow-md">
        <CardHeader className="py-3 px-5 border-b border-border">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
            <span>
              {isPending
                ? "Loading…"
                : `${displayed.length} invoice${displayed.length !== 1 ? "s" : ""}${search || statusFilter !== "all" ? " (filtered)" : ""}`}
            </span>
          </CardTitle>
        </CardHeader>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Invoice", "Date", "Customer", "Items", "Payment", "Total", "Due", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                    <Receipt className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    No invoices found
                  </td>
                </tr>
              ) : (
                displayed.map((sale) => {
                  const status = (sale.paymentStatus?.toLowerCase() ?? "due") as PaymentStatus;
                  const cfg = statusConfig[status] ?? statusConfig.due;
                  const itemCount = sale.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                  const method = sale.payments?.[0]?.paymentMethod ?? "—";

                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-purple-700 dark:text-purple-400 font-mono text-xs">
                          {sale.invoiceNo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(sale.salesdate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground text-xs">
                          {sale.customer?.name ?? "Walk-in"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-center">
                        {itemCount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-medium capitalize">
                          {method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground text-xs whitespace-nowrap">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {sale.paymentDue > 0 ? (
                          <span className="text-red-500 font-semibold">
                            {formatCurrency(sale.paymentDue)}
                          </span>
                        ) : (
                          <span className="text-green-600 font-semibold">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                            onClick={() => router.push(`/sales/pos/invoice/${sale.id}`)}
                            title="View Invoice"
                          >
                            <Eye size={13} />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            onClick={() => {
                              router.push(`/sales/pos/invoice/${sale.id}`);
                              setTimeout(() => window.print(), 800);
                            }}
                            title="Print"
                          >
                            <Printer size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {isPending ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 rounded bg-muted animate-pulse w-32" />
                <div className="h-3 rounded bg-muted animate-pulse w-48" />
              </div>
            ))
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No invoices found
            </div>
          ) : (
            displayed.map((sale) => {
              const status = (sale.paymentStatus?.toLowerCase() ?? "due") as PaymentStatus;
              const cfg = statusConfig[status] ?? statusConfig.due;
              return (
                <div
                  key={sale.id}
                  className="p-4 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => router.push(`/sales/pos/invoice/${sale.id}`)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-purple-700 dark:text-purple-400 font-mono text-xs">
                      {sale.invoiceNo}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sale.customer?.name ?? "Walk-in"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(sale.salesdate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(sale.grandTotal)}</p>
                      {sale.paymentDue > 0 && (
                        <p className="text-[10px] text-red-500">Due: {formatCurrency(sale.paymentDue)}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Page {meta.currentPage} of {meta.totalPages} • {meta.totalCount} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  className="h-8 gap-1"
                  disabled={!meta.hasPrevPage || isPending}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-8 gap-1"
                  disabled={!meta.hasNextPage || isPending}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}