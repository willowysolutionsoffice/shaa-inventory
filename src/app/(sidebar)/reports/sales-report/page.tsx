"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getBrandListForDropdown, getSubBrandsByBrand } from "@/actions/brand-actions";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { getUserList } from "@/actions/user-action";
import { getSalesReport } from "@/actions/sales-action"; // ← import the server action

// ── Types ─────────────────────────────────────────────────────────────────────

interface SaleItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
    purchasePrice: number;
    product: {
        id: string;
        productName: string;
        sku: string;
        stock: number;
        brandId?: string;
        subBrandId?: string;
        supplierId?: string;
    };
}

interface Sale {
    id: string;
    invoiceNo: string;
    salesDate: string;
    grandTotal: number;
    paymentStatus: string;
    paymentDue: number;
    customer: { id: string; name: string; phone?: string };
    branch: { id: string; name: string };
    salesman?: { id: string; name: string } | null;
    salesmanId?: string | null;
    items: SaleItem[];
}

interface ProductMeta {
    id: string;
    brandId?: string;
    subBrandId?: string;
    supplierId?: string;
}

interface DropdownItem { id: string; name: string }

interface Filters {
    from: string;
    to: string;
    month: string;
    year: string;
    brandId: string;
    subBrandId: string;
    branchId: string;
    salesmanId: string;
}

interface ReportRow {
    slNo: number;
    invoiceNo: string;
    date: string;
    year: number;
    month: string;
    itemCode: string;
    itemName: string;
    qty: number;
    baseUnit: string;
    unitPrice: number;
    amount: number;
    discount: number;
    subtotal: number;
    total: number;
    customerName: string;
    branchName: string;
    salesmanName: string;
    salesmanId: string;
    paymentStatus: string;
    productId: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const DEFAULT_FILTERS: Filters = {
    from: "", to: "", month: "", year: String(currentYear),
    brandId: "", subBrandId: "", branchId: "", salesmanId: "",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterSelect({
    label, value, onChange, options, placeholder, disabled,
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
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function DateInput({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void;
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

// ── Export helpers ────────────────────────────────────────────────────────────

function exportToCSV(
    rows: ReportRow[],
    totals: { qty: number; amount: number; discount: number; subtotal: number; total: number },
) {
    const headers = [
        "Sl.No", "Invoice", "Date", "Year", "Month",
        "Item Code", "Item Name", "Qty", "Unit",
        "Unit Price", "Amount", "Discount", "Subtotal", "Net Amount",
        "Customer", "Branch", "Salesman", "Status",
    ];
    const esc = (v: string | number) => {
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const dataRows = rows.map((r) =>
        [r.slNo, r.invoiceNo, r.date, r.year, r.month,
        r.itemCode, r.itemName, r.qty, r.baseUnit,
        r.unitPrice, r.amount, r.discount, r.subtotal, r.total,
        r.customerName, r.branchName, r.salesmanName, r.paymentStatus].map(esc).join(",")
    );
    const totalsRow = [
        "Total", "", "", "", "", "", "",
        totals.qty, "", "",
        totals.amount, totals.discount, totals.subtotal, totals.total,
        "", "", "", "",
    ].map(esc).join(",");
    const csv = [headers.join(","), ...dataRows, totalsRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF(
    rows: ReportRow[],
    totals: { qty: number; amount: number; discount: number; subtotal: number; total: number },
    filters: Filters,
) {
    const dateLabel =
        filters.from && filters.to
            ? `${filters.from} to ${filters.to}`
            : filters.month
                ? `${MONTHS.find((m) => m.value === filters.month)?.label ?? ""} ${filters.year}`
                : filters.year;

    const rowsHtml = rows.map((r) => `
    <tr>
      <td>${r.slNo}</td><td>${r.invoiceNo}</td>
      <td style="white-space:nowrap">${r.date}</td>
      <td>${r.year}</td><td>${r.month}</td>
      <td>${r.itemCode}</td><td>${r.itemName}</td>
      <td class="r">${r.qty}</td><td>${r.baseUnit}</td>
      <td class="r">${r.unitPrice.toFixed(2)}</td>
      <td class="r">${r.amount.toFixed(2)}</td>
      <td class="r">${r.discount > 0 ? r.discount.toFixed(2) : "—"}</td>
      <td class="r">${r.subtotal.toFixed(2)}</td>
      <td class="r">${r.total.toFixed(2)}</td>
      <td>${r.customerName}</td><td>${r.branchName}</td><td>${r.salesmanName}</td>
      <td><span class="badge ${r.paymentStatus}">${r.paymentStatus}</span></td>
    </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Sales Report</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
h1{font-size:18px;font-weight:700;margin-bottom:2px}
.sub{font-size:11px;color:#666;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:10px}
th{background:#f3f4f6;border:1px solid #d1d5db;padding:5px 6px;text-align:left;font-weight:600}
td{border:1px solid #e5e7eb;padding:4px 6px}
.r{text-align:right}.tot{background:#f9fafb;font-weight:700}
.badge{display:inline-block;padding:1px 6px;border-radius:9999px;font-size:9px;font-weight:600}
.PAID{background:#dcfce7;color:#166534}.PARTIAL{background:#fef9c3;color:#854d0e}.PENDING{background:#fee2e2;color:#991b1b}
@media print{body{padding:0}}
</style></head><body>
<h1>Sales Report</h1>
<div class="sub">Period: ${dateLabel}&nbsp;·&nbsp;Generated: ${new Date().toLocaleString("en-IN")}</div>
<table><thead><tr>
  <th>#</th><th>Invoice</th><th>Date</th><th>Year</th><th>Month</th>
  <th>Code</th><th>Item Name</th><th class="r">Qty</th><th>Unit</th>
  <th class="r">Unit Price</th><th class="r">Amount</th>
  <th class="r">Discount</th><th class="r">Subtotal</th>
  <th class="r">Net Amount</th><th>Customer</th><th>Branch</th><th>Salesman</th><th>Status</th>
</tr></thead><tbody>
${rowsHtml}
<tr class="tot">
  <td colspan="7">Total</td>
  <td class="r">${totals.qty}</td><td></td><td></td>
  <td class="r">${totals.amount.toFixed(2)}</td>
  <td class="r">${totals.discount.toFixed(2)}</td>
  <td class="r">${totals.subtotal.toFixed(2)}</td>
  <td class="r">${totals.total.toFixed(2)}</td>
  <td colspan="4"></td>
</tr></tbody></table></body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SalesReportPage() {
    // "pending" — what the user is editing in the filter UI
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    // "committed" — last state actually sent to the API / used for client filter
    const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

    // Raw rows from API (server only filters by date + branch)
    const [allRows, setAllRows] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [mastersLoading, setMastersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dropdown lists
    const [brands, setBrands] = useState<DropdownItem[]>([]);
    const [subBrands, setSubBrands] = useState<DropdownItem[]>([]);
    const [branches, setBranches] = useState<DropdownItem[]>([]);
    const [salesmen, setSalesmen] = useState<DropdownItem[]>([]);

    // productId → { brandId, subBrandId, supplierId } built from sale item payloads
    const [productMap, setProductMap] = useState<Map<string, ProductMeta>>(new Map());

    // ── Load dropdowns once ────────────────────────────────────────────────────
    useEffect(() => {
        async function loadMasters() {
            setMastersLoading(true);
            try {
                const [b, br, usersRes] = await Promise.all([
                    getBrandListForDropdown(),
                    getBranchListForDropdown(),
                    getUserList(),
                ]);
                const users: any[] = Array.isArray(usersRes) ? usersRes : (usersRes as any)?.data ?? [];
                setBrands(b);
                setBranches(br);
                setSalesmen(users.map((u: any) => ({ id: u.id, name: u.name })).filter((u: DropdownItem) => u.id && u.name));
            } catch { /* non-fatal */ }
            finally { setMastersLoading(false); }
        }
        loadMasters();
    }, []);

    // Reload sub-brands when the brand filter changes (only pending state)
    useEffect(() => {
        if (!filters.brandId) { setSubBrands([]); return; }
        getSubBrandsByBrand(filters.brandId)
            .then(setSubBrands)
            .catch(() => setSubBrands([]));
    }, [filters.brandId]);

    // ── Date range builder ─────────────────────────────────────────────────────
    function buildDateRange(f: Filters) {
        if (f.from && f.to) return { from: f.from, to: f.to };
        if (f.month && f.year) {
            const y = Number(f.year), m = Number(f.month);
            return {
                from: new Date(y, m - 1, 1).toISOString().split("T")[0],
                to: new Date(y, m, 0).toISOString().split("T")[0],
            };
        }
        if (f.year) {
            const y = Number(f.year);
            return { from: `${y}-01-01`, to: `${y}-12-31` };
        }
        return { from: "", to: "" };
    }

    // ── API fetch (date + branch only — those are server-supported) ────────────
    const fetchReport = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = buildDateRange(f);

      // ── Now runs server-side — cookies forwarded correctly on Vercel ──
      const result = await getSalesReport({
        from:     from || undefined,
        to:       to   || undefined,
        branchId: f.branchId || undefined,
        salesmanId: f.salesmanId || undefined,
        limit:    500,
        page:     1,
      });

      if ('error' in result) {
        setError(result.error ?? 'Failed to load report');
        return;
      }

      const sales: Sale[] = result.sales ?? [];

      // Build product→meta map
      const newMap = new Map<string, ProductMeta>();
      for (const sale of sales) {
        for (const item of sale.items ?? []) {
          if (item.product && !newMap.has(item.productId)) {
            newMap.set(item.productId, {
              id:         item.productId,
              brandId:    item.product.brandId,
              subBrandId: item.product.subBrandId,
              supplierId: item.product.supplierId,
            });
          }
        }
      }
      setProductMap(newMap);

      // Flatten sales → rows
      const rows: ReportRow[] = [];
      let sl = 1;
      for (const sale of sales) {
        if (!Array.isArray(sale.items)) continue;
        const d       = new Date(sale.salesDate);
        const year    = d.getFullYear();
        const month   = d.toLocaleString("en-IN", { month: "long" });
        const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        for (const item of sale.items) {
          rows.push({
            slNo:          sl++,
            invoiceNo:     sale.invoiceNo,
            date:          dateStr,
            year,
            month,
            itemCode:      item.product?.sku          ?? item.productId,
            itemName:      item.product?.productName  ?? "—",
            qty:           item.quantity,
            baseUnit:      "PCs",
            unitPrice:     Number(item.unitPrice),
            amount:        Number(item.unitPrice) * item.quantity,
            discount:      Number(item.discount),
            subtotal:      Number(item.subtotal),
            total:         Number(item.total),
            customerName:  sale.customer?.name ?? "—",
            branchName:    sale.branch?.name   ?? "—",
            salesmanName:  sale.salesman?.name ?? "—",
            salesmanId:    sale.salesman?.id ?? sale.salesmanId ?? "",
            paymentStatus: sale.paymentStatus,
            productId:     item.productId,
          });
        }
      }
      setAllRows(rows);
    } catch (e: any) {
      setError(e.message ?? "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

    // Initial load on mount
    useEffect(() => { fetchReport(DEFAULT_FILTERS); }, [fetchReport]);

    // ── Apply: commit filters and re-fetch ─────────────────────────────────────
    function handleApply() {
        setAppliedFilters({ ...filters });
        fetchReport(filters);
    }

    // ── Clear ──────────────────────────────────────────────────────────────────
    function clearFilters() {
        setFilters(DEFAULT_FILTERS);
        setSubBrands([]);
        setAppliedFilters(DEFAULT_FILTERS);
        fetchReport(DEFAULT_FILTERS);
    }

    // ── Client-side brand / sub-brand / supplier filter ────────────────────────
    // Runs instantly against allRows without a new API call.
    // Uses appliedFilters (committed state), not filters (pending state).
    const filteredRows = allRows.filter((row) => {
        const { brandId, subBrandId, salesmanId } = appliedFilters;

        if (salesmanId && row.salesmanId !== salesmanId) return false;

        if (!brandId && !subBrandId) return true;

        const meta = productMap.get(row.productId);

        if (brandId) {
            if (!meta?.brandId || meta.brandId !== brandId) return false;
        }
        if (subBrandId) {
            if (!meta?.subBrandId || meta.subBrandId !== subBrandId) return false;
        }

        return true;
    });

    // Re-number after client filter
    const rows = filteredRows.map((r, i) => ({ ...r, slNo: i + 1 }));

    // ── Filter setter ──────────────────────────────────────────────────────────
    function setFilter(key: keyof Filters, value: string) {
        setFilters((prev) => {
            const next = { ...prev, [key]: value };
            if (key === "brandId") next.subBrandId = "";
            if (key === "month" || key === "year") { next.from = ""; next.to = ""; }
            if (key === "from" || key === "to") next.month = "";
            return next;
        });
    }

    // ── Totals ─────────────────────────────────────────────────────────────────
    const totals = rows.reduce(
        (acc, r) => ({
            qty: acc.qty + r.qty,
            amount: acc.amount + r.amount,
            discount: acc.discount + r.discount,
            subtotal: acc.subtotal + r.subtotal,
            total: acc.total + r.total,
        }),
        { qty: 0, amount: 0, discount: 0, subtotal: 0, total: 0 },
    );

    const statusColor: Record<string, string> = {
        PAID: "bg-green-100 text-green-700",
        PARTIAL: "bg-yellow-100 text-yellow-700",
        PENDING: "bg-red-100 text-red-700",
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 space-y-4">

            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Item-wise sales with brand, sub-brand, supplier and date filters
                    </p>
                </div>

                {rows.length > 0 && (
                    <div className="flex items-center gap-2">

                        <Button
                            variant="outline" size="sm"
                            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => exportToCSV(rows, totals)}
                        >
                            <FileSpreadsheet className="h-4 w-4" /> Export Excel
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => exportToPDF(rows, totals, appliedFilters)}
                        >
                            <FileText className="h-4 w-4" /> Print
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <FilterSelect
                            label="Year" value={filters.year}
                            onChange={(v) => setFilter("year", v)}
                            options={YEARS.map((y) => ({ value: y, label: y }))}
                            placeholder="All Years"
                        />
                        <FilterSelect
                            label="Month" value={filters.month}
                            onChange={(v) => setFilter("month", v)}
                            options={MONTHS} placeholder="All Months"
                        />
                        <DateInput label="From" value={filters.from} onChange={(v) => setFilter("from", v)} />
                        <DateInput label="To" value={filters.to} onChange={(v) => setFilter("to", v)} />

                        <FilterSelect
                            label={mastersLoading ? "Brand (loading…)" : "Brand"}
                            value={filters.brandId}
                            onChange={(v) => setFilter("brandId", v)}
                            options={brands.map((b) => ({ value: b.id, label: b.name }))}
                            placeholder="All Brands"
                            disabled={mastersLoading}
                        />
                        <FilterSelect
                            label="Sub-brand" value={filters.subBrandId}
                            onChange={(v) => setFilter("subBrandId", v)}
                            options={subBrands.map((s) => ({ value: s.id, label: s.name }))}
                            placeholder={filters.brandId ? "All Sub-brands" : "Select brand first"}
                            disabled={!filters.brandId}
                        />

                        <FilterSelect
                            label={mastersLoading ? "Branch (loading…)" : "Branch"}
                            value={filters.branchId}
                            onChange={(v) => setFilter("branchId", v)}
                            options={branches.map((b) => ({ value: b.id, label: b.name }))}
                            placeholder="All Branches"
                            disabled={mastersLoading}
                        />

                        <FilterSelect
                            label={mastersLoading ? "Salesman (loading…)" : "Salesman"}
                            value={filters.salesmanId}
                            onChange={(v) => setFilter("salesmanId", v)}
                            options={salesmen.map((s) => ({ value: s.id, label: s.name }))}
                            placeholder="All Salesmen"
                            disabled={mastersLoading}
                        />

                        <div className="flex gap-2 items-end">
                            <Button onClick={handleApply} disabled={loading} size="sm">
                                {loading ? "Loading…" : "Apply"}
                            </Button>
                            <Button variant="outline" onClick={clearFilters} size="sm">
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary cards */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Lines", value: rows.length.toString() },
                        { label: "Total Qty", value: totals.qty.toString() },
                        { label: "Gross Amount", value: formatCurrency(totals.amount) },
                        { label: "Net Amount", value: formatCurrency(totals.total) },
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

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="py-4 text-destructive text-sm">{error}</CardContent>
                </Card>
            )}

            {/* Table */}
            {loading ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                        Loading sales data…
                    </CardContent>
                </Card>
            ) : rows.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                        No sales found for the selected filters.
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {rows.length} line item{rows.length !== 1 ? "s" : ""}
                            {totals.discount > 0 && ` · ${formatCurrency(totals.discount)} total discount`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Invoice</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Year</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Month</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Item Code</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Item Name</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Unit</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Unit Price</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Discount</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Subtotal</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Net Amount</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Customer</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Branch</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Salesman</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.slNo} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 text-muted-foreground">{row.slNo}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{row.invoiceNo}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                                        <td className="px-3 py-2">{row.year}</td>
                                        <td className="px-3 py-2">{row.month}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{row.itemCode}</td>
                                        <td className="px-3 py-2 max-w-[180px] truncate" title={row.itemName}>{row.itemName}</td>
                                        <td className="px-3 py-2 text-right">{row.qty}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{row.baseUnit}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(row.unitPrice)}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(row.amount)}</td>
                                        <td className="px-3 py-2 text-right text-orange-600">
                                            {row.discount > 0 ? formatCurrency(row.discount) : "—"}
                                        </td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(row.subtotal)}</td>
                                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.total)}</td>
                                        <td className="px-3 py-2 max-w-[130px] truncate" title={row.customerName}>{row.customerName}</td>
                                        <td className="px-3 py-2">{row.branchName}</td>
                                        <td className="px-3 py-2 max-w-[130px] truncate" title={row.salesmanName}>{row.salesmanName}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[row.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
                                                {row.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {/* Totals row */}
                                <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                                    <td colSpan={7} className="px-3 py-2.5">Total</td>
                                    <td className="px-3 py-2.5 text-right">{totals.qty}</td>
                                    <td className="px-3 py-2.5" /><td className="px-3 py-2.5" />
                                    <td className="px-3 py-2.5 text-right">{formatCurrency(totals.amount)}</td>
                                    <td className="px-3 py-2.5 text-right text-orange-600">{formatCurrency(totals.discount)}</td>
                                    <td className="px-3 py-2.5 text-right">{formatCurrency(totals.subtotal)}</td>
                                    <td className="px-3 py-2.5 text-right">{formatCurrency(totals.total)}</td>
                                    <td colSpan={4} />
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}