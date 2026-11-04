"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Search,
  Users,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";
import { getSalesReport } from "@/actions/sales-action";
import { getSalesReturnList } from "@/actions/sales-return-action";
import { BranchDropdownItem } from "@/actions/branch-action";
import { User } from "@/actions/user-action";

// ── Types ─────────────────────────────────────────────────────────────────────

type DatePreset =
  | ""
  | "today"
  | "yesterday"
  | "last3days"
  | "last7days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "custom";

interface Filters {
  datePreset: DatePreset;
  from: string;
  to: string;
  year: string;
  month: string;
  branchId: string;
  salesmanId: string;
}

export interface SalesmanSummaryRow {
  slNo: number;
  salesmanId: string;
  salesmanName: string;
  branchName: string;
  invoicesCount: number;
  grossSales: number;
  salesReturn: number;
  effectiveSales: number;
  totalCollection: number;
  pendingCollection: number;
  collectionRate: number;
  isUnassigned: boolean;
}

interface SalesmanReportClientProps {
  branches: BranchDropdownItem[];
  users: User[];
  userRole: string;
}

// ── Constants & Helpers ───────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last3days", label: "Last 3 Days" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

function formatDateForInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_FILTERS: Filters = {
  datePreset: "thisMonth",
  from: "",
  to: "",
  year: String(currentYear),
  month: String(new Date().getMonth() + 1).padStart(2, "0"),
  branchId: "",
  salesmanId: "",
};

// ── Standard Filter Select & Date Input (Matching Theme) ─────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export function SalesmanReportClient({
  branches,
  users,
  userRole,
}: SalesmanReportClientProps) {
  const [filters, setFilters] = useState<Filters>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      ...DEFAULT_FILTERS,
      from: formatDateForInput(firstDay),
      to: formatDateForInput(now),
    };
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);
  const [searchQuery, setSearchQuery] = useState("");
  const [rawSales, setRawSales] = useState<any[]>([]);
  const [rawReturns, setRawReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Distinct salesman options (from users, with fallback to distinct salesmen in loaded sales)
  const salesmanOptions = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    if (list.length > 0) {
      return list.map((u) => ({ value: u.id, label: u.name }));
    }
    const map = new Map<string, string>();
    for (const s of rawSales) {
      if (s.salesman?.id && s.salesman?.name) {
        map.set(s.salesman.id, s.salesman.name);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [users, rawSales]);

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of branches) {
      if (b.id) m.set(b.id, b.name);
    }
    return m;
  }, [branches]);

  // Date Preset Handler
  const handleDatePresetChange = (val: string) => {
    const preset = val as DatePreset;
    const today = new Date();
    let from = "";
    let to = "";

    if (preset === "today") {
      from = to = formatDateForInput(today);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(today.getDate() - 1);
      from = to = formatDateForInput(y);
    } else if (preset === "last3days") {
      const d = new Date();
      d.setDate(today.getDate() - 2);
      from = formatDateForInput(d);
      to = formatDateForInput(today);
    } else if (preset === "last7days") {
      const d = new Date();
      d.setDate(today.getDate() - 6);
      from = formatDateForInput(d);
      to = formatDateForInput(today);
    } else if (preset === "thisMonth") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      from = formatDateForInput(first);
      to = formatDateForInput(today);
    } else if (preset === "lastMonth") {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      from = formatDateForInput(first);
      to = formatDateForInput(last);
    } else if (preset === "thisYear") {
      from = `${today.getFullYear()}-01-01`;
      to = formatDateForInput(today);
    } else if (preset === "lastYear") {
      const py = today.getFullYear() - 1;
      from = `${py}-01-01`;
      to = `${py}-12-31`;
    }

    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      from,
      to,
      year: "",
      month: "",
    }));
  };

  const handleYearChange = (year: string) => {
    setFilters((prev) => {
      const y = Number(year);
      let from = prev.from;
      let to = prev.to;
      if (year) {
        if (prev.month) {
          const m = Number(prev.month);
          from = formatDateForInput(new Date(y, m - 1, 1));
          to = formatDateForInput(new Date(y, m, 0));
        } else {
          from = `${year}-01-01`;
          to = `${year}-12-31`;
        }
      }
      return {
        ...prev,
        year,
        from,
        to,
        datePreset: "",
      };
    });
  };

  const handleMonthChange = (month: string) => {
    setFilters((prev) => {
      const y = Number(prev.year || currentYear);
      let from = prev.from;
      let to = prev.to;
      if (month) {
        const m = Number(month);
        from = formatDateForInput(new Date(y, m - 1, 1));
        to = formatDateForInput(new Date(y, m, 0));
      }
      return {
        ...prev,
        month,
        year: String(y),
        from,
        to,
        datePreset: "",
      };
    });
  };

  // Build API Date boundaries
  const buildDateRange = (f: Filters) => {
    if (f.from && f.to) return { from: f.from, to: f.to };
    if (f.from && !f.to) return { from: f.from, to: f.from };
    if (!f.from && f.to) return { from: f.to, to: f.to };
    if (f.month && f.year) {
      const y = Number(f.year),
        m = Number(f.month);
      return {
        from: formatDateForInput(new Date(y, m - 1, 1)),
        to: formatDateForInput(new Date(y, m, 0)),
      };
    }
    if (f.year) {
      const y = Number(f.year);
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    return { from: "", to: "" };
  };

  const toApiDateBoundary = (value: string, endOfDay = false) => {
    if (!value) return undefined;
    const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
    return new Date(`${value}T${time}`).toISOString();
  };

  // Fetch report data
  const loadData = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = buildDateRange(f);

      if (from && to && from > to) {
        setError("From date cannot be later than To date.");
        setLoading(false);
        return;
      }

      const apiFrom = toApiDateBoundary(from, false);
      const apiTo = toApiDateBoundary(to, true);

      const [salesRes, returnsRes] = await Promise.all([
        getSalesReport({
          from: apiFrom,
          to: apiTo,
          branchId: f.branchId || undefined,
          salesmanId: f.salesmanId || undefined,
          limit: 5000,
          page: 1,
        }),
        getSalesReturnList({
          page: 1,
          limit: 1000,
          branchId: f.branchId || undefined,
          from: apiFrom,
          to: apiTo,
        }).catch(() => null),
      ]);

      if ("error" in salesRes) {
        setError(salesRes.error ?? "Failed to fetch sales data");
        return;
      }

      setRawSales(salesRes.sales ?? []);
      const returns =
        (returnsRes as any)?.data?.returns ??
        (Array.isArray(returnsRes) ? returnsRes : []);
      setRawReturns(Array.isArray(returns) ? returns : []);
    } catch (err: any) {
      setError(
        err?.message ?? "An unexpected error occurred while loading data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(appliedFilters);
  }, [appliedFilters, loadData]);

  const handleApply = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    const cleared: Filters = {
      datePreset: "",
      from: "",
      to: "",
      year: "",
      month: "",
      branchId: "",
      salesmanId: "",
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  // ── Compute Accurate Salesman Summary Table Rows ─────────────────────────────
  const summaryRows: SalesmanSummaryRow[] = useMemo(() => {
    // 1. Map returns to their associated saleId
    const returnsBySaleId = new Map<string, number>();
    for (const ret of rawReturns) {
      if (ret.saleId) {
        const cur = returnsBySaleId.get(ret.saleId) || 0;
        returnsBySaleId.set(ret.saleId, cur + Number(ret.grandTotal || 0));
      }
    }

    interface Accumulator {
      salesmanId: string;
      salesmanName: string;
      branchName: string;
      invoicesCount: number;
      grossSales: number;
      salesReturn: number;
      totalCollection: number;
      pendingCollection: number;
      isUnassigned: boolean;
    }

    const salesmanMap = new Map<string, Accumulator>();
    const salesIdSet = new Set<string>();

    for (const sale of rawSales) {
      if (
        appliedFilters.branchId &&
        sale.branchId !== appliedFilters.branchId &&
        sale.branch?.id !== appliedFilters.branchId
      ) {
        continue;
      }
      if (
        appliedFilters.salesmanId &&
        sale.salesmanId !== appliedFilters.salesmanId &&
        sale.salesman?.id !== appliedFilters.salesmanId
      ) {
        continue;
      }

      salesIdSet.add(sale.id);

      const sId = sale.salesman?.id || sale.salesmanId || "unassigned";
      const sName =
        sale.salesman?.name ||
        (sId === "unassigned"
          ? "Direct / Counter (No Salesman)"
          : `Staff #${sId.slice(0, 6)}`);

      const bName =
        sale.branch?.name ||
        (sale.branchId ? branchMap.get(sale.branchId) : undefined) ||
        "Main Location";

      if (!salesmanMap.has(sId)) {
        salesmanMap.set(sId, {
          salesmanId: sId,
          salesmanName: sName,
          branchName: bName,
          invoicesCount: 0,
          grossSales: 0,
          salesReturn: 0,
          totalCollection: 0,
          pendingCollection: 0,
          isUnassigned: sId === "unassigned",
        });
      }

      const existing = salesmanMap.get(sId)!;

      // 1. Gross Sales
      const gross = Number(sale.grandTotal ?? 0);

      // 2. Returns on this sale
      let retTotal = 0;
      if (Array.isArray(sale.salesReturns) && sale.salesReturns.length > 0) {
        retTotal = sale.salesReturns.reduce(
          (acc: number, r: any) => acc + Number(r.grandTotal || 0),
          0
        );
      } else if (returnsBySaleId.has(sale.id)) {
        retTotal = returnsBySaleId.get(sale.id) || 0;
      }

      // 3. Collection on this sale
      const paymentSum = Array.isArray(sale.payments)
        ? sale.payments.reduce(
            (acc: number, p: any) => acc + Number(p.amount || 0),
            0
          )
        : 0;

      const due = Number(sale.paymentDue ?? 0);
      const paidFromDue = gross > due ? gross - due : 0;
      const collected = paymentSum > 0 ? paymentSum : paidFromDue;

      existing.invoicesCount += 1;
      existing.grossSales += gross;
      existing.salesReturn += retTotal;
      existing.totalCollection += collected;
      existing.pendingCollection += due;
    }

    // 2. Catch returns outside rawSales date boundaries
    for (const ret of rawReturns) {
      if (salesIdSet.has(ret.saleId)) continue;

      const sId =
        ret.sale?.salesman?.id || ret.sale?.salesmanId || "unassigned";
      if (appliedFilters.salesmanId && sId !== appliedFilters.salesmanId)
        continue;
      if (
        appliedFilters.branchId &&
        ret.branchId !== appliedFilters.branchId &&
        ret.sale?.branchId !== appliedFilters.branchId
      )
        continue;

      const sName =
        ret.sale?.salesman?.name ||
        (sId === "unassigned"
          ? "Direct / Counter (No Salesman)"
          : `Staff #${sId.slice(0, 6)}`);
      const bName =
        ret.branch?.name ||
        ret.sale?.branch?.name ||
        (ret.branchId ? branchMap.get(ret.branchId) : undefined) ||
        "Main Location";

      if (!salesmanMap.has(sId)) {
        salesmanMap.set(sId, {
          salesmanId: sId,
          salesmanName: sName,
          branchName: bName,
          invoicesCount: 0,
          grossSales: 0,
          salesReturn: 0,
          totalCollection: 0,
          pendingCollection: 0,
          isUnassigned: sId === "unassigned",
        });
      }

      const existing = salesmanMap.get(sId)!;
      existing.salesReturn += Number(ret.grandTotal || 0);
    }

    // 3. Filter by search input
    const q = searchQuery.trim().toLowerCase();
    const result: SalesmanSummaryRow[] = [];
    let sl = 1;

    for (const acc of salesmanMap.values()) {
      if (
        q &&
        !acc.salesmanName.toLowerCase().includes(q) &&
        !acc.branchName.toLowerCase().includes(q)
      ) {
        continue;
      }

      const effective = Math.max(0, acc.grossSales - acc.salesReturn);
      const pending = Math.max(0, effective - acc.totalCollection);
      const collectionRate =
        effective > 0
          ? Math.min(100, (acc.totalCollection / effective) * 100)
          : acc.grossSales > 0
          ? 0
          : 100;

      result.push({
        slNo: sl++,
        salesmanId: acc.salesmanId,
        salesmanName: acc.salesmanName,
        branchName: acc.branchName,
        invoicesCount: acc.invoicesCount,
        grossSales: acc.grossSales,
        salesReturn: acc.salesReturn,
        effectiveSales: effective,
        totalCollection: acc.totalCollection,
        pendingCollection: pending,
        collectionRate,
        isUnassigned: acc.isUnassigned,
      });
    }

    // Default sort: highest effective sales first
    result.sort((a, b) => b.effectiveSales - a.effectiveSales);

    // Re-assign serial numbers after sorting
    result.forEach((r, idx) => {
      r.slNo = idx + 1;
    });

    return result;
  }, [rawSales, rawReturns, appliedFilters, branchMap, searchQuery]);

  // Overall Totals
  const totals = useMemo(() => {
    const t = summaryRows.reduce(
      (acc, r) => ({
        invoicesCount: acc.invoicesCount + r.invoicesCount,
        grossSales: acc.grossSales + r.grossSales,
        salesReturn: acc.salesReturn + r.salesReturn,
        effectiveSales: acc.effectiveSales + r.effectiveSales,
        totalCollection: acc.totalCollection + r.totalCollection,
        pendingCollection: acc.pendingCollection + r.pendingCollection,
      }),
      {
        invoicesCount: 0,
        grossSales: 0,
        salesReturn: 0,
        effectiveSales: 0,
        totalCollection: 0,
        pendingCollection: 0,
      }
    );

    const collectionRate =
      t.effectiveSales > 0
        ? Math.min(100, (t.totalCollection / t.effectiveSales) * 100)
        : 100;

    return { ...t, collectionRate };
  }, [summaryRows]);

  // Active Date Range Label
  const dateRangeLabel = useMemo(() => {
    const { from, to } = buildDateRange(appliedFilters);
    if (!from && !to) return "All Time";
    if (from && to && from === to) return from;
    if (from && to) return `${from} to ${to}`;
    return from || to || "All Time";
  }, [appliedFilters]);

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (summaryRows.length === 0) return;

    const dataRows = summaryRows.map((r) => ({
      "Sl.No": r.slNo,
      Salesman: r.salesmanName,
      Branch: r.branchName,
      Invoices: r.invoicesCount,
      "Total Sales (Gross)": r.grossSales,
      "Total Sales Return": r.salesReturn,
      "Effective Sales": r.effectiveSales,
      "Total Collection": r.totalCollection,
      "Pending (Due)": r.pendingCollection,
      "Collection %": `${r.collectionRate.toFixed(1)}%`,
    }));

    // Append totals row
    dataRows.push({
      "Sl.No": 0,
      Salesman: "TOTAL",
      Branch: "-",
      Invoices: totals.invoicesCount,
      "Total Sales (Gross)": totals.grossSales,
      "Total Sales Return": totals.salesReturn,
      "Effective Sales": totals.effectiveSales,
      "Total Collection": totals.totalCollection,
      "Pending (Due)": totals.pendingCollection,
      "Collection %": `${totals.collectionRate.toFixed(1)}%`,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salesman Report");

    const todayStr = formatDateForInput(new Date());
    XLSX.writeFile(workbook, `Salesman_Report_${todayStr}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salesman Report</h1>
          <p className="text-sm text-muted-foreground">
            Sales performance, returns, and payment collection tracking by
            salesman
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={loading || summaryRows.length === 0}
            className="gap-1.5 text-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={loading || summaryRows.length === 0}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* ── Filters (Standard Enterprise Filter Design) ───────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <FilterSelect
              label="Date Range"
              value={filters.datePreset}
              onChange={handleDatePresetChange}
              options={DATE_PRESETS}
              placeholder="Select Date Range"
            />

            <FilterSelect
              label="Year"
              value={filters.year}
              onChange={handleYearChange}
              options={YEARS.map((y) => ({ value: y, label: y }))}
              placeholder="All Years"
            />

            <FilterSelect
              label="Month"
              value={filters.month}
              onChange={handleMonthChange}
              options={MONTHS}
              placeholder="All Months"
            />

            <DateInput
              label="From"
              value={filters.from}
              onChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  from: v,
                  datePreset: "custom",
                }))
              }
            />

            <DateInput
              label="To"
              value={filters.to}
              onChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  to: v,
                  datePreset: "custom",
                }))
              }
            />

            <FilterSelect
              label="Branch"
              value={filters.branchId}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, branchId: v }))
              }
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="All Branches"
            />

            <FilterSelect
              label="Salesman"
              value={filters.salesmanId}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, salesmanId: v }))
              }
              options={salesmanOptions}
              placeholder="All Salesmen"
            />

            <div className="flex gap-2 items-end">
              <Button onClick={handleApply} disabled={loading} size="sm">
                {loading ? "Loading…" : "Apply"}
              </Button>
              <Button variant="outline" onClick={handleClear} size="sm">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary KPI Cards (Matching Theme) ─────────────────────────────────── */}
      {summaryRows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: "Total Sales",
              value: formatCurrency(totals.grossSales),
            },
            {
              label: "Total Sales Return",
              value: formatCurrency(totals.salesReturn),
            },
            {
              label: "Effective Sales",
              value: formatCurrency(totals.effectiveSales),
            },
            {
              label: "Total Collection",
              value: formatCurrency(totals.totalCollection),
            },
            {
              label: "Collection Rate",
              value: `${totals.collectionRate.toFixed(1)}%`,
            },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-semibold mt-0.5">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadData(appliedFilters)}
              className="h-7 text-xs"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Table Bar (Search & Date Range Header) ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-sm font-semibold text-foreground">
          Salesman Breakdown ({summaryRows.length})
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search salesman or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Date Range:{" "}
            <span className="font-semibold text-foreground">
              {dateRangeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Data Table (Exact Theme Table Design) ───────────────────────── */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Loading salesman report data…
            </div>
          ) : summaryRows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No sales records found for the selected filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                  <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                  <th className="px-3 py-2.5 text-left font-semibold">
                    Salesman
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold">
                    Branch
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    Invoices
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Total Sales
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Total Sales Return
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Effective Sales
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Total Collection
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Pending (Due)
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    Collection %
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr
                    key={row.salesmanId}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {row.slNo}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{row.salesmanName}</span>
                        {row.isUnassigned ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                            Direct
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                            Staff
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.branchName}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-xs">
                      {row.invoicesCount}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(row.grossSales)}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-600 font-medium">
                      {row.salesReturn > 0
                        ? `-${formatCurrency(row.salesReturn)}`
                        : "₹0.00"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-foreground">
                      {formatCurrency(row.effectiveSales)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                      {formatCurrency(row.totalCollection)}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-600 font-medium">
                      {row.pendingCollection > 0
                        ? formatCurrency(row.pendingCollection)
                        : "₹0.00"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.collectionRate >= 95
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : row.collectionRate >= 70
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300"
                            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300"
                        }`}
                      >
                        {row.collectionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Totals row */}
                <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                  <td colSpan={3} className="px-3 py-2.5">
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {totals.invoicesCount}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    {formatCurrency(totals.grossSales)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-rose-600 font-semibold">
                    {totals.salesReturn > 0
                      ? `-${formatCurrency(totals.salesReturn)}`
                      : "₹0.00"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-foreground font-bold">
                    {formatCurrency(totals.effectiveSales)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">
                    {formatCurrency(totals.totalCollection)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-amber-600 font-semibold">
                    {totals.pendingCollection > 0
                      ? formatCurrency(totals.pendingCollection)
                      : "₹0.00"}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold">
                    {totals.collectionRate.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
