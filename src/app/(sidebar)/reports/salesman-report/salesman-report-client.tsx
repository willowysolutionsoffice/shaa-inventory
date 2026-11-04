"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  Building2,
  TrendingUp,
  Wallet,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";
import { getSalesReport } from "@/actions/sales-action";
import { getSalesReturnList } from "@/actions/sales-return-action";
import { BranchDropdownItem } from "@/actions/branch-action";
import { User } from "@/actions/user-action";

// ── Types ─────────────────────────────────────────────────────────────────────

type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

interface Filters {
  datePreset: DatePreset;
  from: string;
  to: string;
  year: string;
  month: string;
  branchId: string;
  salesmanId: string;
  search: string;
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
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
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
  branchId: "all",
  salesmanId: "all",
  search: "",
};

// ── Sub-component for Filter Inputs ───────────────────────────────────────────

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
    <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-initial">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        <option value="all">{placeholder}</option>
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
    <div className="flex flex-col gap-1 min-w-[130px]">
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
  const [rawSales, setRawSales] = useState<any[]>([]);
  const [rawReturns, setRawReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<keyof SalesmanSummaryRow>("effectiveSales");
  const [sortAsc, setSortAsc] = useState(false); // default highest sales first

  // Distinct salesman options (from users prop, with fallback to distinct salesmen in loaded sales)
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

  // Date Preset Handler
  const handleDatePresetChange = (preset: DatePreset) => {
    const now = new Date();
    let newFrom = "";
    let newTo = "";

    if (preset === "today") {
      newFrom = formatDateForInput(now);
      newTo = formatDateForInput(now);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      newFrom = formatDateForInput(y);
      newTo = formatDateForInput(y);
    } else if (preset === "thisWeek") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      newFrom = formatDateForInput(monday);
      newTo = formatDateForInput(new Date());
    } else if (preset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      newFrom = formatDateForInput(firstDay);
      newTo = formatDateForInput(now);
    } else if (preset === "lastMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      newFrom = formatDateForInput(firstDay);
      newTo = formatDateForInput(lastDay);
    } else if (preset === "thisYear") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      newFrom = formatDateForInput(firstDay);
      newTo = formatDateForInput(now);
    }

    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      from: newFrom,
      to: newTo,
    }));
  };

  // Fetch report data
  const loadData = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 2000,
      };

      if (f.from) params.from = `${f.from}T00:00:00.000Z`;
      if (f.to) params.to = `${f.to}T23:59:59.999Z`;
      if (f.branchId !== "all") params.branchId = f.branchId;
      if (f.salesmanId !== "all") params.salesmanId = f.salesmanId;

      const [salesRes, returnsRes] = await Promise.all([
        getSalesReport(params),
        getSalesReturnList({
          limit: 2000,
          from: params.from,
          to: params.to,
          branchId: f.branchId !== "all" ? f.branchId : undefined,
        }).catch(() => null),
      ]);

      if ("error" in salesRes) {
        setError(salesRes.error ?? "Failed to fetch sales data");
        return;
      }

      setRawSales(salesRes.sales ?? []);
      const returns = (returnsRes as any)?.data?.returns ?? (Array.isArray(returnsRes) ? returnsRes : []);
      setRawReturns(Array.isArray(returns) ? returns : []);
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred while loading data");
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
      ...DEFAULT_FILTERS,
      datePreset: "all",
      from: "",
      to: "",
      branchId: "all",
      salesmanId: "all",
      search: "",
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of branches) {
      if (b.id) m.set(b.id, b.name);
    }
    return m;
  }, [branches]);

  // Aggregate Salesman Performance Table Rows
  const summaryRows: SalesmanSummaryRow[] = useMemo(() => {
    // 1. Map returns to their associated saleId
    const returnsBySaleId = new Map<string, number>();
    for (const ret of rawReturns) {
      if (ret.saleId) {
        const cur = returnsBySaleId.get(ret.saleId) || 0;
        returnsBySaleId.set(ret.saleId, cur + Number(ret.grandTotal || 0));
      }
    }

    // 2. Aggregate sales per salesman
    interface Accumulator {
      salesmanId: string;
      salesmanName: string;
      branchName: string;
      invoicesCount: number;
      grossSales: number;
      salesReturn: number;
      totalCollection: number;
    }

    const salesmanMap = new Map<string, Accumulator>();

    for (const sale of rawSales) {
      const sId = sale.salesman?.id || sale.salesmanId || "unassigned";
      const sName =
        sale.salesman?.name ||
        (sId === "unassigned" ? "Direct / Counter (Unassigned)" : `Staff #${sId.slice(0, 6)}`);

      const bName =
        sale.branch?.name ||
        (sale.branchId ? branchMap.get(sale.branchId) : undefined) ||
        "Main Location";

      const existing = salesmanMap.get(sId) || {
        salesmanId: sId,
        salesmanName: sName,
        branchName: bName,
        invoicesCount: 0,
        grossSales: 0,
        salesReturn: 0,
        totalCollection: 0,
      };

      const gross = Number(sale.grandTotal || 0);

      // Returns on this sale
      let retTotal = returnsBySaleId.get(sale.id) || 0;
      if (retTotal === 0 && Array.isArray(sale.salesReturns)) {
        retTotal = sale.salesReturns.reduce(
          (acc: number, r: any) => acc + Number(r.grandTotal || 0),
          0
        );
      }

      // Payments collected
      let collTotal = 0;
      if (Array.isArray(sale.payments)) {
        collTotal = sale.payments.reduce(
          (acc: number, p: any) => acc + Number(p.amount || 0),
          0
        );
      }

      existing.invoicesCount += 1;
      existing.grossSales += gross;
      existing.salesReturn += retTotal;
      existing.totalCollection += collTotal;

      salesmanMap.set(sId, existing);
    }

    // 3. Filter by search input (if user types salesman name)
    const searchQuery = appliedFilters.search.trim().toLowerCase();

    const result: SalesmanSummaryRow[] = [];
    let sl = 1;

    for (const acc of salesmanMap.values()) {
      if (
        searchQuery &&
        !acc.salesmanName.toLowerCase().includes(searchQuery) &&
        !acc.branchName.toLowerCase().includes(searchQuery)
      ) {
        continue;
      }

      const effective = acc.grossSales - acc.salesReturn;
      const pending = Math.max(0, effective - acc.totalCollection);
      const collectionRate =
        effective > 0 ? Math.min(100, (acc.totalCollection / effective) * 100) : 100;

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
      });
    }

    // 4. Sort according to active sortField
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

    // Re-assign Sl.No after sorting
    return result.map((r, idx) => ({ ...r, slNo: idx + 1 }));
  }, [rawSales, rawReturns, branchMap, appliedFilters.search, sortField, sortAsc]);

  // Totals for table footer and top KPI cards
  const totals = useMemo(() => {
    return summaryRows.reduce(
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
  }, [summaryRows]);

  const overallCollectionRate =
    totals.effectiveSales > 0
      ? Math.min(100, (totals.totalCollection / totals.effectiveSales) * 100)
      : 100;

  // Sorting toggle
  const toggleSort = (field: keyof SalesmanSummaryRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numbers
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const branchLabel =
      appliedFilters.branchId === "all"
        ? "All Branches"
        : branchMap.get(appliedFilters.branchId) || "Selected Branch";

    const dateRangeLabel =
      appliedFilters.from && appliedFilters.to
        ? `${appliedFilters.from} to ${appliedFilters.to}`
        : "All Time";

    const generatedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const worksheetData = [
      ["SHAA CALICUT ENTERPRISE"],
      ["SALESMAN PERFORMANCE & COLLECTION REPORT"],
      [`Location / Branch: ${branchLabel}`],
      [`Date Range: ${dateRangeLabel}`],
      [`Generated On: ${generatedAt}`],
      [],
      [
        "Sl.No",
        "Salesman Name",
        "Branch Location",
        "Invoices Billed",
        "Total Sales (Gross)",
        "Total Sales Return",
        "Effective Sales (Net)",
        "Total Collection",
        "Pending Collection",
        "Collection %",
      ],
      ...summaryRows.map((r) => [
        r.slNo,
        r.salesmanName,
        r.branchName,
        r.invoicesCount,
        Number(r.grossSales.toFixed(2)),
        Number(r.salesReturn.toFixed(2)),
        Number(r.effectiveSales.toFixed(2)),
        Number(r.totalCollection.toFixed(2)),
        Number(r.pendingCollection.toFixed(2)),
        `${r.collectionRate.toFixed(1)}%`,
      ]),
      [
        "TOTAL",
        "ALL SALESMEN",
        "",
        totals.invoicesCount,
        Number(totals.grossSales.toFixed(2)),
        Number(totals.salesReturn.toFixed(2)),
        Number(totals.effectiveSales.toFixed(2)),
        Number(totals.totalCollection.toFixed(2)),
        Number(totals.pendingCollection.toFixed(2)),
        `${overallCollectionRate.toFixed(1)}%`,
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Salesman Report");
    XLSX.writeFile(
      wb,
      `Salesman_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-[1600px] mx-auto print:p-0 print:space-y-3">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:border-none">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Salesman Performance &amp; Collection Report
            </h1>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
              Management Only
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time breakdown of salesman revenue, returns, effective net sales, and verified collections
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 font-medium"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 font-medium"
          >
            <FileText className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* ── Top KPI Metric Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <Card className="bg-card shadow-xs border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <span>Total Sales (Gross)</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {formatCurrency(totals.grossSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totals.invoicesCount} total billed orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <span>Sales Returns</span>
              <RotateCcw className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
              {formatCurrency(totals.salesReturn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Refunds and credit notes deducted
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <span>Effective Sales (Net)</span>
              <Wallet className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {formatCurrency(totals.effectiveSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Realized business revenue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <span>Total Collection</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(totals.totalCollection)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Rate: {overallCollectionRate.toFixed(1)}%</span>
              {totals.pendingCollection > 0 && (
                <span className="text-amber-600 font-semibold">
                  Due: {formatCurrency(totals.pendingCollection)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters Card — Exact Enterprise Design ────────────────────────────── */}
      <Card className="print:hidden">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <FilterSelect
              label="Date Preset"
              value={filters.datePreset}
              onChange={(v) => handleDatePresetChange(v as DatePreset)}
              options={DATE_PRESETS}
              placeholder="All Time"
            />

            <FilterSelect
              label="Year"
              value={filters.year}
              onChange={(v) => setFilters((prev) => ({ ...prev, year: v }))}
              options={YEARS.map((y) => ({ value: y, label: y }))}
              placeholder="All Years"
            />

            <FilterSelect
              label="Month"
              value={filters.month}
              onChange={(v) => setFilters((prev) => ({ ...prev, month: v }))}
              options={MONTHS}
              placeholder="All Months"
            />

            <DateInput
              label="From"
              value={filters.from}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, from: v, datePreset: "custom" }))
              }
            />

            <DateInput
              label="To"
              value={filters.to}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, to: v, datePreset: "custom" }))
              }
            />

            <FilterSelect
              label="Branch"
              value={filters.branchId}
              onChange={(v) => setFilters((prev) => ({ ...prev, branchId: v }))}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="All Branches"
            />

            <FilterSelect
              label="Salesman"
              value={filters.salesmanId}
              onChange={(v) => setFilters((prev) => ({ ...prev, salesmanId: v }))}
              options={salesmanOptions}
              placeholder="All Salesmen"
            />

            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Search Salesman
              </label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                <Input
                  placeholder="Filter by salesman name or branch…"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="h-9 pl-9 text-sm bg-background"
                />
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <Button onClick={handleApply} disabled={loading} size="sm" className="h-9 px-4">
                {loading ? "Loading…" : "Apply"}
              </Button>
              <Button variant="outline" onClick={handleClear} size="sm" className="h-9 px-3 text-xs">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center justify-between gap-2 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(appliedFilters)}
            className="h-7 text-xs border-red-300 hover:bg-red-100 dark:border-red-800"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Main Data Table ──────────────────────────────────────────────────── */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <TableRow className="text-[11px] uppercase tracking-wider font-bold">
                <TableHead className="w-16 text-center font-bold">Sl.No</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("salesmanName")}
                    className="flex items-center gap-1.5 font-bold hover:text-foreground text-left"
                  >
                    <span>Salesman</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("branchName")}
                    className="flex items-center gap-1.5 font-bold hover:text-foreground text-left"
                  >
                    <span>Branch</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    type="button"
                    onClick={() => toggleSort("invoicesCount")}
                    className="inline-flex items-center gap-1.5 font-bold hover:text-foreground"
                  >
                    <span>Orders</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("grossSales")}
                    className="inline-flex items-center gap-1.5 font-bold hover:text-foreground ml-auto"
                  >
                    <span>Total Sales (Gross)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("salesReturn")}
                    className="inline-flex items-center gap-1.5 font-bold hover:text-foreground ml-auto"
                  >
                    <span>Total Sales Return</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right bg-purple-50/50 dark:bg-purple-950/20">
                  <button
                    type="button"
                    onClick={() => toggleSort("effectiveSales")}
                    className="inline-flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200 hover:text-purple-600 ml-auto"
                  >
                    <span>Effective Sales (Net)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("totalCollection")}
                    className="inline-flex items-center gap-1.5 font-bold hover:text-foreground ml-auto"
                  >
                    <span>Total Collection</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("pendingCollection")}
                    className="inline-flex items-center gap-1.5 font-bold hover:text-foreground ml-auto"
                  >
                    <span>Pending (Due)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center font-bold">Collection %</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                      <span className="text-sm font-medium">Aggregating Salesman Performance Data…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : summaryRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Users className="h-8 w-8 stroke-[1.5] text-muted-foreground/40 mb-1" />
                      <p className="font-semibold text-sm">No Sales Records Found</p>
                      <p className="text-xs">
                        No transactions recorded for the selected date range and branch filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                summaryRows.map((row) => {
                  const isUnassigned = row.salesmanId === "unassigned";

                  return (
                    <TableRow key={row.salesmanId} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {row.slNo}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <span className={isUnassigned ? "text-muted-foreground italic" : "text-foreground"}>
                            {row.salesmanName}
                          </span>
                          {isUnassigned && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 bg-muted text-muted-foreground">
                              Counter
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span>{row.branchName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {row.invoicesCount}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatCurrency(row.grossSales)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-rose-600 dark:text-rose-400">
                        {row.salesReturn > 0 ? `-${formatCurrency(row.salesReturn)}` : "₹ 0.00"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/20">
                        {formatCurrency(row.effectiveSales)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.totalCollection)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {row.pendingCollection > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {formatCurrency(row.pendingCollection)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            row.collectionRate >= 95
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : row.collectionRate >= 70
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {row.collectionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>

            {/* Table Footer with Overall Totals */}
            {summaryRows.length > 0 && (
              <TableFooter className="bg-muted/70 border-t-2 font-bold text-xs">
                <TableRow>
                  <TableCell colSpan={3} className="font-extrabold uppercase tracking-wide">
                    Total Summary ({summaryRows.length} Salesmen)
                  </TableCell>
                  <TableCell className="text-center font-extrabold">
                    {totals.invoicesCount}
                  </TableCell>
                  <TableCell className="text-right font-extrabold">
                    {formatCurrency(totals.grossSales)}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-rose-600 dark:text-rose-400">
                    {totals.salesReturn > 0 ? `-${formatCurrency(totals.salesReturn)}` : "₹ 0.00"}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100/40 dark:bg-purple-900/30">
                    {formatCurrency(totals.effectiveSales)}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.totalCollection)}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-amber-600 dark:text-amber-400">
                    {totals.pendingCollection > 0 ? formatCurrency(totals.pendingCollection) : "₹ 0.00"}
                  </TableCell>
                  <TableCell className="text-center font-extrabold text-purple-700 dark:text-purple-300">
                    {overallCollectionRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
}

