"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  FileText,
  Layers,
  Tag,
  Tags,
  Truck,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";
import {
  getBrandListForDropdown,
  getSubBrandsByBrand,
  getBrandListWithSubBrands,
  Brand as BrandType,
} from "@/actions/brand-actions";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { getPurchaseReport } from "@/actions/purchase-actions";
import { getPurchaseReturnList } from "@/actions/purchase-return-action";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: {
    id: string;
    productName: string;
    sku: string;
    unit?: string;
    brandId?: string;
    subBrandId?: string;
    brand?: { id: string; name: string };
  };
}

interface Purchase {
  id: string;
  purchaseNo: string;
  purchaseDate: string;
  totalAmount: number;
  paymentStatus: string;
  paymentDue: number;
  supplier?: { id: string; name: string; phone?: string };
  branch?: { id: string; name: string };
  items: PurchaseItem[];
}

interface PurchaseReturnItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: {
    id: string;
    productName?: string;
    sku?: string;
    brandId?: string;
    subBrandId?: string;
    brand?: { id: string; name: string };
  };
}

interface PurchaseReturn {
  id: string;
  returnNo?: string;
  referenceNo?: string;
  returnDate: string | Date;
  purchaseId?: string;
  supplierId?: string;
  branchId?: string;
  totalAmount: number;
  items: PurchaseReturnItem[];
}

interface ProductMeta {
  id: string;
  productName?: string;
  brandId?: string;
  brandName?: string;
  subBrandId?: string;
  subBrandName?: string;
}

interface DropdownItem {
  id: string;
  name: string;
}

export interface BrandPurchaseSummary {
  brandId: string;
  brandName: string;
  grossQty: number;
  grossPurchases: number;
  returnQty: number;
  returnAmount: number;
  netQty: number;
  netPurchases: number;
  sharePercent: number;
}

export interface SubBrandPurchaseSummary {
  subBrandId: string;
  subBrandName: string;
  brandId: string;
  brandName: string;
  grossQty: number;
  grossPurchases: number;
  returnQty: number;
  returnAmount: number;
  netQty: number;
  netPurchases: number;
  sharePercent: number;
}

export interface SupplierPurchaseSummary {
  supplierId: string;
  supplierName: string;
  ordersCount: number;
  totalQty: number;
  totalPurchases: number;
  returnQty: number;
  returnAmount: number;
  netPurchases: number;
  sharePercent: number;
}

type DatePreset =
  | ""
  | "today"
  | "yesterday"
  | "last3days"
  | "last7days"
  | "lastMonth"
  | "lastYear"
  | "singleDay"
  | "custom";

interface Filters {
  datePreset: DatePreset;
  from: string;
  to: string;
  month: string;
  year: string;
  brandId: string;
  subBrandId: string;
  branchId: string;
  supplierId: string;
}

interface ReportRow {
  slNo: number;
  poNo: string;
  date: string;
  year: number;
  month: string;
  brandName: string;
  subBrandName: string;
  itemCode: string;
  itemName: string;
  qty: number;
  baseUnit: string;
  unitPrice: number;
  amount: number;
  supplierName: string;
  branchName: string;
  paymentStatus: string;
  productId: string;
}

type ActiveView = "items" | "brand" | "subbrand" | "supplier";

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPANY_NAME = "SHAASHOPY";

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

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last3days", label: "Last 3 Days" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "lastMonth", label: "Last Month" },
  { value: "lastYear", label: "Last Year" },
  { value: "singleDay", label: "Single Day" },
  { value: "custom", label: "Custom Range" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const DEFAULT_FILTERS: Filters = {
  datePreset: "",
  from: "",
  to: "",
  month: "",
  year: String(currentYear),
  brandId: "",
  subBrandId: "",
  branchId: "",
  supplierId: "",
};

function formatDateForInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Export Helpers ────────────────────────────────────────────────────────────

function getDateRangeLabel(f: Filters): string {
  if (f.from && f.to) {
    return f.from === f.to ? f.from : `${f.from} to ${f.to}`;
  }
  if (f.from) return `From ${f.from}`;
  if (f.to) return `Until ${f.to}`;
  if (f.month && f.year) {
    const m = MONTHS.find((item) => item.value === f.month)?.label ?? f.month;
    return `${m} ${f.year}`;
  }
  if (f.year) return `Year ${f.year}`;
  return "All Time";
}

function exportPurchaseReportToExcel({
  brandRows,
  subBrandRows,
  supplierRows,
  itemRows,
  brandTotals,
  subBrandTotals,
  supplierTotals,
  itemTotals,
  filters,
  branchName,
}: {
  brandRows: BrandPurchaseSummary[];
  subBrandRows: SubBrandPurchaseSummary[];
  supplierRows: SupplierPurchaseSummary[];
  itemRows: ReportRow[];
  brandTotals: { grossQty: number; grossPurchases: number; returnQty: number; returnAmount: number; netQty: number; netPurchases: number };
  subBrandTotals: { grossQty: number; grossPurchases: number; returnQty: number; returnAmount: number; netQty: number; netPurchases: number };
  supplierTotals: { totalPurchases: number; totalQty: number; ordersCount: number; returnQty: number; returnAmount: number; netPurchases: number };
  itemTotals: { qty: number; amount: number };
  filters: Filters;
  branchName: string;
}) {
  const workbook = XLSX.utils.book_new();
  const dateRangeLabel = getDateRangeLabel(filters);
  const generatedAt = new Date().toLocaleString("en-IN");

  // 1. Detailed Item Purchases
  const itemSheetData: any[][] = [
    [COMPANY_NAME],
    ["DETAILED ITEM-WISE PURCHASE REPORT"],
    [`Date Range Covered: ${dateRangeLabel}`],
    [`Branch: ${branchName}`],
    [`Generated On: ${generatedAt}`],
    [],
    [
      "Sl.No",
      "PO Number",
      "Date",
      "Year",
      "Month",
      "Brand",
      "Sub-Brand",
      "Item Code",
      "Item Name",
      "Qty",
      "Unit",
      "Unit Price (INR)",
      "Total Amount (INR)",
      "Supplier",
      "Branch",
      "Payment Status",
    ],
    ...itemRows.map((r) => [
      r.slNo,
      r.poNo,
      r.date,
      r.year,
      r.month,
      r.brandName,
      r.subBrandName,
      r.itemCode,
      r.itemName,
      r.qty,
      r.baseUnit,
      Number(r.unitPrice.toFixed(2)),
      Number(r.amount.toFixed(2)),
      r.supplierName,
      r.branchName,
      r.paymentStatus,
    ]),
    [
      "Total",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      itemTotals.qty,
      "",
      "",
      Number(itemTotals.amount.toFixed(2)),
      "",
      "",
      "",
    ],
  ];
  const wsItems = XLSX.utils.aoa_to_sheet(itemSheetData);
  wsItems["!cols"] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
    { wch: 10 },
    { wch: 8 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsItems, "Detailed Items");

  // 2. Brand Purchases
  const brandSheetData: any[][] = [
    [COMPANY_NAME],
    ["BRAND-WISE PURCHASE REPORT"],
    [`Date Range Covered: ${dateRangeLabel}`],
    [`Branch: ${branchName}`],
    [`Generated On: ${generatedAt}`],
    [],
    [
      "Sl.No",
      "Brand Name",
      "Gross Qty",
      "Gross Purchases (INR)",
      "Return Qty",
      "Purchase Return (INR)",
      "Net Qty",
      "Net Purchases (INR)",
      "Share %",
    ],
    ...brandRows.map((b, idx) => [
      idx + 1,
      b.brandName,
      b.grossQty,
      Number(b.grossPurchases.toFixed(2)),
      b.returnQty,
      Number(b.returnAmount.toFixed(2)),
      b.netQty,
      Number(b.netPurchases.toFixed(2)),
      `${b.sharePercent.toFixed(1)}%`,
    ]),
    [
      "Total",
      "ALL BRANDS",
      brandTotals.grossQty,
      Number(brandTotals.grossPurchases.toFixed(2)),
      brandTotals.returnQty,
      Number(brandTotals.returnAmount.toFixed(2)),
      brandTotals.netQty,
      Number(brandTotals.netPurchases.toFixed(2)),
      "100.0%",
    ],
  ];
  const wsBrand = XLSX.utils.aoa_to_sheet(brandSheetData);
  wsBrand["!cols"] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsBrand, "Brand Purchases");

  // 3. Sub-Brand Purchases
  const subBrandSheetData: any[][] = [
    [COMPANY_NAME],
    ["SUB-BRAND WISE PURCHASE REPORT"],
    [`Date Range Covered: ${dateRangeLabel}`],
    [`Branch: ${branchName}`],
    [`Generated On: ${generatedAt}`],
    [],
    [
      "Sl.No",
      "Sub-Brand Name",
      "Brand Name",
      "Gross Qty",
      "Gross Purchases (INR)",
      "Return Qty",
      "Purchase Return (INR)",
      "Net Qty",
      "Net Purchases (INR)",
      "Share %",
    ],
    ...subBrandRows.map((s, idx) => [
      idx + 1,
      s.subBrandName,
      s.brandName,
      s.grossQty,
      Number(s.grossPurchases.toFixed(2)),
      s.returnQty,
      Number(s.returnAmount.toFixed(2)),
      s.netQty,
      Number(s.netPurchases.toFixed(2)),
      `${s.sharePercent.toFixed(1)}%`,
    ]),
    [
      "Total",
      "ALL SUB-BRANDS",
      "",
      subBrandTotals.grossQty,
      Number(subBrandTotals.grossPurchases.toFixed(2)),
      subBrandTotals.returnQty,
      Number(subBrandTotals.returnAmount.toFixed(2)),
      subBrandTotals.netQty,
      Number(subBrandTotals.netPurchases.toFixed(2)),
      "100.0%",
    ],
  ];
  const wsSubBrand = XLSX.utils.aoa_to_sheet(subBrandSheetData);
  wsSubBrand["!cols"] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 24 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSubBrand, "Sub-Brand Purchases");

  // 4. Supplier Purchases
  const supplierSheetData: any[][] = [
    [COMPANY_NAME],
    ["SUPPLIER-WISE PURCHASE REPORT"],
    [`Date Range Covered: ${dateRangeLabel}`],
    [`Branch: ${branchName}`],
    [`Generated On: ${generatedAt}`],
    [],
    [
      "Sl.No",
      "Supplier Name",
      "Orders Count",
      "Total Qty",
      "Total Purchases (INR)",
      "Returns (INR)",
      "Net Purchases (INR)",
      "Share %",
    ],
    ...supplierRows.map((s, idx) => [
      idx + 1,
      s.supplierName,
      s.ordersCount,
      s.totalQty,
      Number(s.totalPurchases.toFixed(2)),
      Number(s.returnAmount.toFixed(2)),
      Number(s.netPurchases.toFixed(2)),
      `${s.sharePercent.toFixed(1)}%`,
    ]),
    [
      "Total",
      "ALL SUPPLIERS",
      supplierTotals.ordersCount,
      supplierTotals.totalQty,
      Number(supplierTotals.totalPurchases.toFixed(2)),
      Number(supplierTotals.returnAmount.toFixed(2)),
      Number(supplierTotals.netPurchases.toFixed(2)),
      "100.0%",
    ],
  ];
  const wsSuppliers = XLSX.utils.aoa_to_sheet(supplierSheetData);
  wsSuppliers["!cols"] = [
    { wch: 8 },
    { wch: 32 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSuppliers, "Supplier Purchases");

  const cleanDateRange = dateRangeLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
  XLSX.writeFile(workbook, `Purchase_Report_${cleanDateRange}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

function exportToPrint({
  activeView,
  brandRows,
  subBrandRows,
  supplierRows,
  itemRows,
  brandTotals,
  subBrandTotals,
  supplierTotals,
  itemTotals,
  filters,
}: {
  activeView: ActiveView;
  brandRows: BrandPurchaseSummary[];
  subBrandRows: SubBrandPurchaseSummary[];
  supplierRows: SupplierPurchaseSummary[];
  itemRows: ReportRow[];
  brandTotals: any;
  subBrandTotals: any;
  supplierTotals: any;
  itemTotals: any;
  filters: Filters;
}) {
  const dateLabel = getDateRangeLabel(filters);
  let tableHtml = "";

  if (activeView === "items") {
    const rowsHtml = itemRows
      .map(
        (r) => `
      <tr>
        <td>${r.slNo}</td>
        <td>${r.poNo}</td>
        <td style="white-space:nowrap">${r.date}</td>
        <td>${r.year}</td>
        <td>${r.month}</td>
        <td>${r.brandName}</td>
        <td>${r.subBrandName}</td>
        <td>${r.itemCode}</td>
        <td>${r.itemName}</td>
        <td class="r">${r.qty}</td>
        <td>${r.baseUnit}</td>
        <td class="r">${r.unitPrice.toFixed(2)}</td>
        <td class="r">${r.amount.toFixed(2)}</td>
        <td>${r.supplierName}</td>
        <td>${r.branchName}</td>
        <td>${r.paymentStatus}</td>
      </tr>`
      )
      .join("");

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>PO No</th>
            <th>Date</th>
            <th>Year</th>
            <th>Month</th>
            <th>Brand</th>
            <th>Sub-Brand</th>
            <th>Code</th>
            <th>Item Name</th>
            <th class="r">Qty</th>
            <th>Unit</th>
            <th class="r">Unit Price</th>
            <th class="r">Amount</th>
            <th>Supplier</th>
            <th>Branch</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="tot">
            <td colspan="9">Total</td>
            <td class="r">${itemTotals.qty}</td>
            <td colspan="2"></td>
            <td class="r">${itemTotals.amount.toFixed(2)}</td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>`;
  } else if (activeView === "brand") {
    const rowsHtml = brandRows
      .map(
        (b, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${b.brandName}</td>
        <td class="r">${b.grossQty}</td>
        <td class="r">${b.grossPurchases.toFixed(2)}</td>
        <td class="r text-rose">${b.returnQty}</td>
        <td class="r text-rose">${b.returnAmount.toFixed(2)}</td>
        <td class="r">${b.netQty}</td>
        <td class="r font-bold">${b.netPurchases.toFixed(2)}</td>
        <td class="r">${b.sharePercent.toFixed(1)}%</td>
      </tr>`
      )
      .join("");

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Brand Name</th>
            <th class="r">Gross Qty</th>
            <th class="r">Gross Purchases (₹)</th>
            <th class="r">Return Qty</th>
            <th class="r">Purchase Return (₹)</th>
            <th class="r">Net Qty</th>
            <th class="r">Net Purchases (₹)</th>
            <th class="r">Share %</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="tot">
            <td>Total</td>
            <td>ALL BRANDS</td>
            <td class="r">${brandTotals.grossQty}</td>
            <td class="r">${brandTotals.grossPurchases.toFixed(2)}</td>
            <td class="r">${brandTotals.returnQty}</td>
            <td class="r">${brandTotals.returnAmount.toFixed(2)}</td>
            <td class="r">${brandTotals.netQty}</td>
            <td class="r">${brandTotals.netPurchases.toFixed(2)}</td>
            <td class="r">100.0%</td>
          </tr>
        </tbody>
      </table>`;
  } else if (activeView === "subbrand") {
    const rowsHtml = subBrandRows
      .map(
        (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.subBrandName}</td>
        <td>${s.brandName}</td>
        <td class="r">${s.grossQty}</td>
        <td class="r">${s.grossPurchases.toFixed(2)}</td>
        <td class="r text-rose">${s.returnQty}</td>
        <td class="r text-rose">${s.returnAmount.toFixed(2)}</td>
        <td class="r">${s.netQty}</td>
        <td class="r font-bold">${s.netPurchases.toFixed(2)}</td>
        <td class="r">${s.sharePercent.toFixed(1)}%</td>
      </tr>`
      )
      .join("");

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Sub-Brand Name</th>
            <th>Brand Name</th>
            <th class="r">Gross Qty</th>
            <th class="r">Gross Purchases (₹)</th>
            <th class="r">Return Qty</th>
            <th class="r">Purchase Return (₹)</th>
            <th class="r">Net Qty</th>
            <th class="r">Net Purchases (₹)</th>
            <th class="r">Share %</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="tot">
            <td>Total</td>
            <td>ALL SUB-BRANDS</td>
            <td></td>
            <td class="r">${subBrandTotals.grossQty}</td>
            <td class="r">${subBrandTotals.grossPurchases.toFixed(2)}</td>
            <td class="r">${subBrandTotals.returnQty}</td>
            <td class="r">${subBrandTotals.returnAmount.toFixed(2)}</td>
            <td class="r">${subBrandTotals.netQty}</td>
            <td class="r">${subBrandTotals.netPurchases.toFixed(2)}</td>
            <td class="r">100.0%</td>
          </tr>
        </tbody>
      </table>`;
  } else {
    const rowsHtml = supplierRows
      .map(
        (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.supplierName}</td>
        <td class="r">${s.ordersCount}</td>
        <td class="r">${s.totalQty}</td>
        <td class="r">${s.totalPurchases.toFixed(2)}</td>
        <td class="r text-rose">${s.returnAmount.toFixed(2)}</td>
        <td class="r font-bold">${s.netPurchases.toFixed(2)}</td>
        <td class="r">${s.sharePercent.toFixed(1)}%</td>
      </tr>`
      )
      .join("");

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Supplier Name</th>
            <th class="r">Orders Count</th>
            <th class="r">Total Qty</th>
            <th class="r">Total Purchases (₹)</th>
            <th class="r">Returns (₹)</th>
            <th class="r">Net Purchases (₹)</th>
            <th class="r">Share %</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="tot">
            <td>Total</td>
            <td>ALL SUPPLIERS</td>
            <td class="r">${supplierTotals.ordersCount}</td>
            <td class="r">${supplierTotals.totalQty}</td>
            <td class="r">${supplierTotals.totalPurchases.toFixed(2)}</td>
            <td class="r">${supplierTotals.returnAmount.toFixed(2)}</td>
            <td class="r">${supplierTotals.netPurchases.toFixed(2)}</td>
            <td class="r">100.0%</td>
          </tr>
        </tbody>
      </table>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Purchase Report - ${COMPANY_NAME}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
h1{font-size:18px;font-weight:700;margin-bottom:2px}
.sub{font-size:11px;color:#666;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:10px}
th{background:#f3f4f6;border:1px solid #d1d5db;padding:5px 6px;text-align:left;font-weight:600}
td{border:1px solid #e5e7eb;padding:4px 6px}
.r{text-align:right}
.tot{background:#f9fafb;font-weight:700}
.text-rose{color:#e11d48}
.font-bold{font-weight:bold}
@media print{body{padding:0}}
</style></head><body>
<h1>Purchase Report</h1>
<div class="sub">Company: ${COMPANY_NAME}&nbsp;·&nbsp;Period: ${dateLabel}&nbsp;·&nbsp;Generated: ${new Date().toLocaleString("en-IN")}</div>
${tableHtml}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PurchaseReportPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

  const [activeView, setActiveView] = useState<ActiveView>("items");
  const [searchQuery, setSearchQuery] = useState("");

  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [allReturns, setAllReturns] = useState<PurchaseReturn[]>([]);

  const [loading, setLoading] = useState(false);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown lists
  const [brands, setBrands] = useState<DropdownItem[]>([]);
  const [subBrands, setSubBrands] = useState<DropdownItem[]>([]);
  const [branches, setBranches] = useState<DropdownItem[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownItem[]>([]);
  const [allBrandsWithSubs, setAllBrandsWithSubs] = useState<BrandType[]>([]);

  // Product metadata map
  const [productMap, setProductMap] = useState<Map<string, ProductMeta>>(new Map());

  // Brand and Sub-brand lookup maps
  const brandNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of brands) {
      map.set(b.id, b.name);
    }
    for (const b of allBrandsWithSubs) {
      map.set(b.id, b.name);
    }
    return map;
  }, [brands, allBrandsWithSubs]);

  const subBrandMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; brandId: string; brandName: string }>();
    for (const b of allBrandsWithSubs) {
      if (Array.isArray(b.subBrands)) {
        for (const sb of b.subBrands) {
          map.set(sb.id, {
            id: sb.id,
            name: sb.name,
            brandId: b.id,
            brandName: b.name,
          });
        }
      }
    }
    return map;
  }, [allBrandsWithSubs]);

  // Load masters on mount
  useEffect(() => {
    async function loadMasters() {
      setMastersLoading(true);
      try {
        const [b, br, sup, brandsWithSubs] = await Promise.all([
          getBrandListForDropdown(),
          getBranchListForDropdown(),
          getSupplierListForDropdown(),
          getBrandListWithSubBrands(),
        ]);
        setBrands(b ?? []);
        setBranches(br ?? []);
        setSuppliers((sup ?? []).map((s: any) => ({ id: s.id, name: s.name })));
        setAllBrandsWithSubs(brandsWithSubs ?? []);
      } catch {
        /* non-fatal */
      } finally {
        setMastersLoading(false);
      }
    }
    loadMasters();
  }, []);

  // Update sub-brand dropdown when brand selection changes
  useEffect(() => {
    if (!filters.brandId) {
      // Show all sub-brands when no brand is selected
      const allSubs: DropdownItem[] = [];
      for (const b of allBrandsWithSubs) {
        if (Array.isArray(b.subBrands)) {
          for (const sb of b.subBrands) {
            allSubs.push({ id: sb.id, name: `${sb.name} (${b.name})` });
          }
        }
      }
      setSubBrands(allSubs);
      return;
    }
    getSubBrandsByBrand(filters.brandId)
      .then(setSubBrands)
      .catch(() => setSubBrands([]));
  }, [filters.brandId, allBrandsWithSubs]);

  // Date range builder
  function buildDateRange(f: Filters) {
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
  }

  // Fetch report data
  const fetchReport = useCallback(
    async (f: Filters) => {
      setLoading(true);
      setError(null);
      try {
        const { from, to } = buildDateRange(f);

        const [purchaseRes, returnRes] = await Promise.all([
          getPurchaseReport({
            from: from || undefined,
            to: to || undefined,
            branchId: f.branchId || undefined,
            supplierId: f.supplierId || undefined,
            limit: 500,
            page: 1,
          }),
          getPurchaseReturnList({
            page: 1,
            limit: 500,
            from: from || undefined,
            to: to || undefined,
            brandId: f.brandId || undefined,
            subBrandId: f.subBrandId || undefined,
          }).catch(() => null),
        ]);

        if ("error" in purchaseRes) {
          setError(purchaseRes.error ?? "Failed to load purchase report");
          return;
        }

        const purchases: Purchase[] = purchaseRes.purchases ?? [];
        const returns: PurchaseReturn[] = ((returnRes as any)?.data?.returns ?? []) as PurchaseReturn[];

        setAllPurchases(purchases);
        setAllReturns(returns);

        // Build product -> meta map
        const newMap = new Map<string, ProductMeta>();
        for (const p of purchases) {
          for (const item of p.items ?? []) {
            if (item.product && !newMap.has(item.productId)) {
              const bName =
                item.product.brand?.name ||
                (item.product.brandId ? brandNameMap.get(item.product.brandId) : undefined);
              const sbInfo = item.product.subBrandId
                ? subBrandMap.get(item.product.subBrandId)
                : undefined;

              newMap.set(item.productId, {
                id: item.productId,
                productName: item.product.productName,
                brandId: item.product.brandId || sbInfo?.brandId,
                brandName: bName || sbInfo?.brandName,
                subBrandId: item.product.subBrandId,
                subBrandName: sbInfo?.name,
              });
            }
          }
        }
        setProductMap(newMap);
      } catch (e: any) {
        setError(e.message ?? "Failed to load report");
      } finally {
        setLoading(false);
      }
    },
    [brandNameMap, subBrandMap]
  );

  // Initial load
  useEffect(() => {
    fetchReport(DEFAULT_FILTERS);
  }, [fetchReport]);

  // Apply filters
  function handleApply() {
    setAppliedFilters({ ...filters });
    fetchReport(filters);
  }

  // Clear filters
  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    fetchReport(DEFAULT_FILTERS);
  }

  // Filter setter
  function setFilter(key: keyof Filters, value: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "brandId") next.subBrandId = "";
      if (key === "month" || key === "year") {
        next.from = "";
        next.to = "";
      }
      if (key === "from" || key === "to") next.month = "";
      return next;
    });
  }

  // Date preset handler
  function setDatePreset(val: string) {
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
    } else if (preset === "lastMonth") {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      from = formatDateForInput(first);
      to = formatDateForInput(last);
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
      month: "",
      year: "",
    }));
  }

  // Filter purchases according to appliedFilters
  const filteredPurchases = useMemo(() => {
    return allPurchases.filter((p) => {
      if (appliedFilters.supplierId && p.supplier?.id !== appliedFilters.supplierId) {
        return false;
      }
      if (appliedFilters.branchId && p.branch?.id !== appliedFilters.branchId) {
        return false;
      }
      return true;
    });
  }, [allPurchases, appliedFilters]);

  // Build Detailed Item Rows
  const itemRows: ReportRow[] = useMemo(() => {
    const rows: ReportRow[] = [];
    let sl = 1;

    for (const purchase of filteredPurchases) {
      if (!Array.isArray(purchase.items)) continue;
      const d = new Date(purchase.purchaseDate);
      const year = d.getFullYear();
      const month = d.toLocaleString("en-IN", { month: "long" });
      const dateStr = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      for (const item of purchase.items) {
        const meta = productMap.get(item.productId);
        const bId = item.product?.brandId || meta?.brandId;
        const sbId = item.product?.subBrandId || meta?.subBrandId;

        // Apply Brand and Sub-brand filter to item
        if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
        if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

        const brandName =
          meta?.brandName ||
          item.product?.brand?.name ||
          (bId ? brandNameMap.get(bId) : undefined) ||
          (sbId ? subBrandMap.get(sbId)?.brandName : undefined) ||
          "Unbranded";

        const subBrandName =
          meta?.subBrandName ||
          (sbId ? subBrandMap.get(sbId)?.name : undefined) ||
          "—";

        rows.push({
          slNo: sl++,
          poNo: purchase.purchaseNo,
          date: dateStr,
          year,
          month,
          brandName,
          subBrandName,
          itemCode: item.product?.sku ?? item.productId,
          itemName: item.product?.productName ?? "—",
          qty: item.quantity,
          baseUnit: item.product?.unit ?? "PCs",
          unitPrice: Number(item.unitPrice),
          amount: Number(item.total),
          supplierName: purchase.supplier?.name ?? "—",
          branchName: purchase.branch?.name ?? "—",
          paymentStatus: purchase.paymentStatus,
          productId: item.productId,
        });
      }
    }

    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.poNo.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.itemCode.toLowerCase().includes(q) ||
        r.brandName.toLowerCase().includes(q) ||
        r.subBrandName.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
    );
  }, [
    filteredPurchases,
    appliedFilters,
    productMap,
    brandNameMap,
    subBrandMap,
    searchQuery,
  ]);

  // Build Brand Purchases Summary
  const brandSummaryRows: BrandPurchaseSummary[] = useMemo(() => {
    const brandMapAgg = new Map<
      string,
      {
        brandId: string;
        brandName: string;
        grossQty: number;
        grossPurchases: number;
        returnQty: number;
        returnAmount: number;
      }
    >();

    for (const p of filteredPurchases) {
      for (const item of p.items ?? []) {
        const meta = productMap.get(item.productId);
        const bId = item.product?.brandId || meta?.brandId || "unknown";
        const sbId = item.product?.subBrandId || meta?.subBrandId;

        if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
        if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

        const bName =
          meta?.brandName ||
          item.product?.brand?.name ||
          (bId !== "unknown" ? brandNameMap.get(bId) : undefined) ||
          (sbId ? subBrandMap.get(sbId)?.brandName : undefined) ||
          "Unbranded";

        if (!brandMapAgg.has(bName)) {
          brandMapAgg.set(bName, {
            brandId: bId,
            brandName: bName,
            grossQty: 0,
            grossPurchases: 0,
            returnQty: 0,
            returnAmount: 0,
          });
        }
        const b = brandMapAgg.get(bName)!;
        b.grossQty += item.quantity;
        b.grossPurchases += Number(item.total);
      }
    }

    // Accumulate Returns for Brand
    for (const r of allReturns) {
      if (appliedFilters.branchId && r.branchId && r.branchId !== appliedFilters.branchId) {
        continue;
      }
      for (const rItem of r.items ?? []) {
        const meta = productMap.get(rItem.productId);
        const bId = rItem.product?.brandId || meta?.brandId || "unknown";
        const sbId = rItem.product?.subBrandId || meta?.subBrandId;

        if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
        if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

        const bName =
          meta?.brandName ||
          (bId !== "unknown" ? brandNameMap.get(bId) : undefined) ||
          (sbId ? subBrandMap.get(sbId)?.brandName : undefined) ||
          "Unbranded";

        if (!brandMapAgg.has(bName)) {
          brandMapAgg.set(bName, {
            brandId: bId,
            brandName: bName,
            grossQty: 0,
            grossPurchases: 0,
            returnQty: 0,
            returnAmount: 0,
          });
        }
        const b = brandMapAgg.get(bName)!;
        b.returnQty += rItem.quantity;
        b.returnAmount += Number(rItem.total);
      }
    }

    const totalGross = Array.from(brandMapAgg.values()).reduce(
      (sum, item) => sum + item.grossPurchases,
      0
    );

    const list: BrandPurchaseSummary[] = Array.from(brandMapAgg.values()).map((b) => ({
      brandId: b.brandId,
      brandName: b.brandName,
      grossQty: b.grossQty,
      grossPurchases: b.grossPurchases,
      returnQty: b.returnQty,
      returnAmount: b.returnAmount,
      netQty: b.grossQty - b.returnQty,
      netPurchases: b.grossPurchases - b.returnAmount,
      sharePercent: totalGross > 0 ? (b.grossPurchases / totalGross) * 100 : 0,
    }));

    list.sort((a, b) => b.grossPurchases - a.grossPurchases);

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((b) => b.brandName.toLowerCase().includes(q));
  }, [
    filteredPurchases,
    allReturns,
    appliedFilters,
    productMap,
    brandNameMap,
    subBrandMap,
    searchQuery,
  ]);

  // Build Sub-Brand Purchases Summary
  const subBrandSummaryRows: SubBrandPurchaseSummary[] = useMemo(() => {
    const subBrandMapAgg = new Map<
      string,
      {
        subBrandId: string;
        subBrandName: string;
        brandId: string;
        brandName: string;
        grossQty: number;
        grossPurchases: number;
        returnQty: number;
        returnAmount: number;
      }
    >();

    for (const p of filteredPurchases) {
      for (const item of p.items ?? []) {
        const meta = productMap.get(item.productId);
        const bId = item.product?.brandId || meta?.brandId || "unknown";
        const sbId = item.product?.subBrandId || meta?.subBrandId || "general";

        if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
        if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

        const bName =
          meta?.brandName ||
          item.product?.brand?.name ||
          (bId !== "unknown" ? brandNameMap.get(bId) : undefined) ||
          (sbId !== "general" ? subBrandMap.get(sbId)?.brandName : undefined) ||
          "Unbranded";

        const sbName =
          meta?.subBrandName ||
          (sbId !== "general" ? subBrandMap.get(sbId)?.name : undefined) ||
          "General / Direct";

        const compositeKey = `${bName}:::${sbName}`;

        if (!subBrandMapAgg.has(compositeKey)) {
          subBrandMapAgg.set(compositeKey, {
            subBrandId: sbId,
            subBrandName: sbName,
            brandId: bId,
            brandName: bName,
            grossQty: 0,
            grossPurchases: 0,
            returnQty: 0,
            returnAmount: 0,
          });
        }
        const s = subBrandMapAgg.get(compositeKey)!;
        s.grossQty += item.quantity;
        s.grossPurchases += Number(item.total);
      }
    }

    // Accumulate Returns for Sub-Brand
    for (const r of allReturns) {
      if (appliedFilters.branchId && r.branchId && r.branchId !== appliedFilters.branchId) {
        continue;
      }
      for (const rItem of r.items ?? []) {
        const meta = productMap.get(rItem.productId);
        const bId = rItem.product?.brandId || meta?.brandId || "unknown";
        const sbId = rItem.product?.subBrandId || meta?.subBrandId || "general";

        if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
        if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

        const bName =
          meta?.brandName ||
          (bId !== "unknown" ? brandNameMap.get(bId) : undefined) ||
          (sbId !== "general" ? subBrandMap.get(sbId)?.brandName : undefined) ||
          "Unbranded";

        const sbName =
          meta?.subBrandName ||
          (sbId !== "general" ? subBrandMap.get(sbId)?.name : undefined) ||
          "General / Direct";

        const compositeKey = `${bName}:::${sbName}`;

        if (!subBrandMapAgg.has(compositeKey)) {
          subBrandMapAgg.set(compositeKey, {
            subBrandId: sbId,
            subBrandName: sbName,
            brandId: bId,
            brandName: bName,
            grossQty: 0,
            grossPurchases: 0,
            returnQty: 0,
            returnAmount: 0,
          });
        }
        const s = subBrandMapAgg.get(compositeKey)!;
        s.returnQty += rItem.quantity;
        s.returnAmount += Number(rItem.total);
      }
    }

    const totalGross = Array.from(subBrandMapAgg.values()).reduce(
      (sum, item) => sum + item.grossPurchases,
      0
    );

    const list: SubBrandPurchaseSummary[] = Array.from(subBrandMapAgg.values()).map((s) => ({
      subBrandId: s.subBrandId,
      subBrandName: s.subBrandName,
      brandId: s.brandId,
      brandName: s.brandName,
      grossQty: s.grossQty,
      grossPurchases: s.grossPurchases,
      returnQty: s.returnQty,
      returnAmount: s.returnAmount,
      netQty: s.grossQty - s.returnQty,
      netPurchases: s.grossPurchases - s.returnAmount,
      sharePercent: totalGross > 0 ? (s.grossPurchases / totalGross) * 100 : 0,
    }));

    list.sort((a, b) => b.grossPurchases - a.grossPurchases);

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.subBrandName.toLowerCase().includes(q) ||
        s.brandName.toLowerCase().includes(q)
    );
  }, [
    filteredPurchases,
    allReturns,
    appliedFilters,
    productMap,
    brandNameMap,
    subBrandMap,
    searchQuery,
  ]);

  // Build Supplier Purchases Summary
  const supplierSummaryRows: SupplierPurchaseSummary[] = useMemo(() => {
    const supMap = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        ordersCount: number;
        totalQty: number;
        totalPurchases: number;
        returnQty: number;
        returnAmount: number;
      }
    >();

    for (const p of filteredPurchases) {
      const sId = p.supplier?.id ?? "unknown";
      const sName = p.supplier?.name ?? "Direct / Unknown";

      if (!supMap.has(sId)) {
        supMap.set(sId, {
          supplierId: sId,
          supplierName: sName,
          ordersCount: 0,
          totalQty: 0,
          totalPurchases: 0,
          returnQty: 0,
          returnAmount: 0,
        });
      }
      const s = supMap.get(sId)!;
      s.ordersCount += 1;
      s.totalPurchases += Number(p.totalAmount);
      for (const item of p.items ?? []) {
        s.totalQty += item.quantity;
      }
    }

    for (const r of allReturns) {
      const sId = r.supplierId ?? "unknown";
      if (supMap.has(sId)) {
        const s = supMap.get(sId)!;
        s.returnAmount += Number(r.totalAmount);
        for (const item of r.items ?? []) {
          s.returnQty += item.quantity;
        }
      }
    }

    const totalGross = Array.from(supMap.values()).reduce(
      (sum, item) => sum + item.totalPurchases,
      0
    );

    const list: SupplierPurchaseSummary[] = Array.from(supMap.values()).map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      ordersCount: s.ordersCount,
      totalQty: s.totalQty,
      totalPurchases: s.totalPurchases,
      returnQty: s.returnQty,
      returnAmount: s.returnAmount,
      netPurchases: s.totalPurchases - s.returnAmount,
      sharePercent: totalGross > 0 ? (s.totalPurchases / totalGross) * 100 : 0,
    }));

    list.sort((a, b) => b.totalPurchases - a.totalPurchases);

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => s.supplierName.toLowerCase().includes(q));
  }, [filteredPurchases, allReturns, searchQuery]);

  // Overall Totals
  const itemTotals = useMemo(
    () =>
      itemRows.reduce(
        (acc, r) => ({
          qty: acc.qty + r.qty,
          amount: acc.amount + r.amount,
        }),
        { qty: 0, amount: 0 }
      ),
    [itemRows]
  );

  const brandTotals = useMemo(
    () =>
      brandSummaryRows.reduce(
        (acc, b) => ({
          grossQty: acc.grossQty + b.grossQty,
          grossPurchases: acc.grossPurchases + b.grossPurchases,
          returnQty: acc.returnQty + b.returnQty,
          returnAmount: acc.returnAmount + b.returnAmount,
          netQty: acc.netQty + b.netQty,
          netPurchases: acc.netPurchases + b.netPurchases,
        }),
        {
          grossQty: 0,
          grossPurchases: 0,
          returnQty: 0,
          returnAmount: 0,
          netQty: 0,
          netPurchases: 0,
        }
      ),
    [brandSummaryRows]
  );

  const subBrandTotals = useMemo(
    () =>
      subBrandSummaryRows.reduce(
        (acc, s) => ({
          grossQty: acc.grossQty + s.grossQty,
          grossPurchases: acc.grossPurchases + s.grossPurchases,
          returnQty: acc.returnQty + s.returnQty,
          returnAmount: acc.returnAmount + s.returnAmount,
          netQty: acc.netQty + s.netQty,
          netPurchases: acc.netPurchases + s.netPurchases,
        }),
        {
          grossQty: 0,
          grossPurchases: 0,
          returnQty: 0,
          returnAmount: 0,
          netQty: 0,
          netPurchases: 0,
        }
      ),
    [subBrandSummaryRows]
  );

  const supplierTotals = useMemo(
    () =>
      supplierSummaryRows.reduce(
        (acc, s) => ({
          totalPurchases: acc.totalPurchases + s.totalPurchases,
          totalQty: acc.totalQty + s.totalQty,
          ordersCount: acc.ordersCount + s.ordersCount,
          returnQty: acc.returnQty + s.returnQty,
          returnAmount: acc.returnAmount + s.returnAmount,
          netPurchases: acc.netPurchases + s.netPurchases,
        }),
        {
          totalPurchases: 0,
          totalQty: 0,
          ordersCount: 0,
          returnQty: 0,
          returnAmount: 0,
          netPurchases: 0,
        }
      ),
    [supplierSummaryRows]
  );

  const activeBranchName = useMemo(() => {
    if (!appliedFilters.branchId) return "All Branches";
    return branches.find((b) => b.id === appliedFilters.branchId)?.name ?? "Selected Branch";
  }, [appliedFilters.branchId, branches]);

  const statusColor: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    PENDING: "bg-red-100 text-red-700",
  };

  const handleExportExcel = () => {
    exportPurchaseReportToExcel({
      brandRows: brandSummaryRows,
      subBrandRows: subBrandSummaryRows,
      supplierRows: supplierSummaryRows,
      itemRows,
      brandTotals,
      subBrandTotals,
      supplierTotals,
      itemTotals,
      filters: appliedFilters,
      branchName: activeBranchName,
    });
  };

  const handlePrint = () => {
    exportToPrint({
      activeView,
      brandRows: brandSummaryRows,
      subBrandRows: subBrandSummaryRows,
      supplierRows: supplierSummaryRows,
      itemRows,
      brandTotals,
      subBrandTotals,
      supplierTotals,
      itemTotals,
      filters: appliedFilters,
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Brand-wise, sub-brand-wise, supplier-wise and detailed item purchase reports
          </p>
        </div>

        {itemRows.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handlePrint}
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
              label="Date Range"
              value={filters.datePreset}
              onChange={setDatePreset}
              options={DATE_PRESETS}
              placeholder="Select Date Range"
            />

            <FilterSelect
              label="Year"
              value={filters.year}
              onChange={(v) => setFilter("year", v)}
              options={YEARS.map((y) => ({ value: y, label: y }))}
              placeholder="All Years"
            />
            <FilterSelect
              label="Month"
              value={filters.month}
              onChange={(v) => setFilter("month", v)}
              options={MONTHS}
              placeholder="All Months"
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
              label="Sub-brand"
              value={filters.subBrandId}
              onChange={(v) => setFilter("subBrandId", v)}
              options={subBrands.map((s) => ({ value: s.id, label: s.name }))}
              placeholder={filters.brandId ? "All Sub-brands" : "All Sub-brands"}
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
              label={mastersLoading ? "Supplier (loading…)" : "Supplier"}
              value={filters.supplierId}
              onChange={(v) => setFilter("supplierId", v)}
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="All Suppliers"
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

      {/* Summary cards - original card style maintained + Gross, Returns & Net purchases */}
      {itemRows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Lines", value: itemRows.length.toString() },
            { label: "Total Qty", value: itemTotals.qty.toString() },
            { label: "Gross Purchases", value: formatCurrency(itemTotals.amount) },
            { label: "Purchase Returns", value: formatCurrency(brandTotals.returnAmount) },
            {
              label: "Net Purchases",
              value: formatCurrency(itemTotals.amount - brandTotals.returnAmount),
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

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {/* View Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="inline-flex p-1 bg-muted rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveView("items")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === "items"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Detailed Item Purchases ({itemRows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("brand")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === "brand"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Brand Purchases ({brandSummaryRows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("subbrand")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === "subbrand"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tags className="h-3.5 w-3.5" />
            Sub-Brand Purchases ({subBrandSummaryRows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("supplier")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === "supplier"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            Supplier Purchases ({supplierSummaryRows.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Date Range: <span className="font-semibold text-foreground">{getDateRangeLabel(appliedFilters)}</span>
          </div>
        </div>
      </div>

      {/* ── VIEW 1: DETAILED ITEM PURCHASES (Original Table Design) ── */}
      {activeView === "items" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Loading purchase data…
              </div>
            ) : itemRows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No purchases found for the selected filters.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">PO No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Year</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Month</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Brand</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Sub-Brand</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Item Code</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Item Name</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Unit</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Unit Price</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Supplier</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Branch</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map((row) => (
                    <tr key={row.slNo} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{row.slNo}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.poNo}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                      <td className="px-3 py-2">{row.year}</td>
                      <td className="px-3 py-2">{row.month}</td>
                      <td className="px-3 py-2 font-medium">{row.brandName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.subBrandName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.itemCode}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate" title={row.itemName}>
                        {row.itemName}
                      </td>
                      <td className="px-3 py-2 text-right">{row.qty}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.baseUnit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.amount)}</td>
                      <td className="px-3 py-2 max-w-[130px] truncate" title={row.supplierName}>
                        {row.supplierName}
                      </td>
                      <td className="px-3 py-2">{row.branchName}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColor[row.paymentStatus] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {row.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                    <td colSpan={9} className="px-3 py-2.5">
                      Total
                    </td>
                    <td className="px-3 py-2.5 text-right">{itemTotals.qty}</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right">{formatCurrency(itemTotals.amount)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── VIEW 2: BRAND-WISE PURCHASE REPORT ── */}
      {activeView === "brand" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Loading brand purchase data…
              </div>
            ) : brandSummaryRows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No brand purchases recorded for the selected period.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Brand Name</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Gross Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Gross Purchases (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Return Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Purchase Return (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Net Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-700">Net Purchases (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {brandSummaryRows.map((row, idx) => (
                    <tr key={row.brandId || idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-foreground">{row.brandName}</td>
                      <td className="px-3 py-2 text-right">{row.grossQty}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.grossPurchases)}</td>
                      <td className="px-3 py-2 text-right text-rose-600 font-medium">
                        {row.returnQty > 0 ? `-${row.returnQty}` : "0"}
                      </td>
                      <td className="px-3 py-2 text-right text-rose-600 font-medium">
                        {row.returnAmount > 0 ? `-${formatCurrency(row.returnAmount)}` : "₹0.00"}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">{row.netQty}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        {formatCurrency(row.netPurchases)}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {row.sharePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="px-3 py-2.5">ALL BRANDS</td>
                    <td className="px-3 py-2.5 text-right">{brandTotals.grossQty}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(brandTotals.grossPurchases)}</td>
                    <td className="px-3 py-2.5 text-right text-rose-600">
                      {brandTotals.returnQty > 0 ? `-${brandTotals.returnQty}` : "0"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-rose-600">
                      {brandTotals.returnAmount > 0 ? `-${formatCurrency(brandTotals.returnAmount)}` : "₹0.00"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">{brandTotals.netQty}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      {formatCurrency(brandTotals.netPurchases)}
                    </td>
                    <td className="px-3 py-2.5 text-right">100.0%</td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── VIEW 3: SUB-BRAND WISE PURCHASE REPORT ── */}
      {activeView === "subbrand" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Loading sub-brand purchase data…
              </div>
            ) : subBrandSummaryRows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No sub-brand purchases recorded for the selected period.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Sub-Brand Name</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Brand Name</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Gross Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Gross Purchases (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Return Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Purchase Return (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Net Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-700">Net Purchases (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {subBrandSummaryRows.map((row, idx) => (
                    <tr
                      key={`${row.brandId}-${row.subBrandId}-${idx}`}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-foreground">{row.subBrandName}</td>
                      <td className="px-3 py-2 text-muted-foreground font-medium">{row.brandName}</td>
                      <td className="px-3 py-2 text-right">{row.grossQty}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.grossPurchases)}</td>
                      <td className="px-3 py-2 text-right text-rose-600 font-medium">
                        {row.returnQty > 0 ? `-${row.returnQty}` : "0"}
                      </td>
                      <td className="px-3 py-2 text-right text-rose-600 font-medium">
                        {row.returnAmount > 0 ? `-${formatCurrency(row.returnAmount)}` : "₹0.00"}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">{row.netQty}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        {formatCurrency(row.netPurchases)}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {row.sharePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="px-3 py-2.5">ALL SUB-BRANDS</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right">{subBrandTotals.grossQty}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(subBrandTotals.grossPurchases)}</td>
                    <td className="px-3 py-2.5 text-right text-rose-600">
                      {subBrandTotals.returnQty > 0 ? `-${subBrandTotals.returnQty}` : "0"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-rose-600">
                      {subBrandTotals.returnAmount > 0
                        ? `-${formatCurrency(subBrandTotals.returnAmount)}`
                        : "₹0.00"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">{subBrandTotals.netQty}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      {formatCurrency(subBrandTotals.netPurchases)}
                    </td>
                    <td className="px-3 py-2.5 text-right">100.0%</td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── VIEW 4: SUPPLIER-WISE PURCHASE REPORT ── */}
      {activeView === "supplier" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Loading supplier purchase data…
              </div>
            ) : supplierSummaryRows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No supplier purchases recorded for the selected period.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Supplier Name</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Orders Count</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total Purchases (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Returns (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-700">Net Purchases (₹)</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierSummaryRows.map((row, idx) => (
                    <tr key={row.supplierId || idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-foreground">{row.supplierName}</td>
                      <td className="px-3 py-2 text-right">{row.ordersCount}</td>
                      <td className="px-3 py-2 text-right">{row.totalQty}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.totalPurchases)}</td>
                      <td className="px-3 py-2 text-right text-rose-600 font-medium">
                        {row.returnAmount > 0 ? `-${formatCurrency(row.returnAmount)}` : "₹0.00"}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        {formatCurrency(row.netPurchases)}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {row.sharePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="px-3 py-2.5">ALL SUPPLIERS</td>
                    <td className="px-3 py-2.5 text-right">{supplierTotals.ordersCount}</td>
                    <td className="px-3 py-2.5 text-right">{supplierTotals.totalQty}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(supplierTotals.totalPurchases)}</td>
                    <td className="px-3 py-2.5 text-right text-rose-600">
                      {supplierTotals.returnAmount > 0
                        ? `-${formatCurrency(supplierTotals.returnAmount)}`
                        : "₹0.00"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      {formatCurrency(supplierTotals.netPurchases)}
                    </td>
                    <td className="px-3 py-2.5 text-right">100.0%</td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
