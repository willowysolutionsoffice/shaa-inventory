"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Tag, Tags, CreditCard, Layers, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";
import { getBrandListForDropdown, getSubBrandsByBrand, getBrandListWithSubBrands, Brand as BrandType } from "@/actions/brand-actions";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { getUserList } from "@/actions/user-action";
import { getSalesReport } from "@/actions/sales-action";
import { getSalesReturnList } from "@/actions/sales-return-action";

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
        brand?: { id: string; name: string };
    };
}

interface SalePayment {
    id?: string;
    amount: number;
    paymentMethod: string;
    paidOn?: string | Date;
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
    payments?: SalePayment[];
}

interface SalesReturnItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
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

interface SalesReturn {
    id: string;
    returnNo: string;
    returnDate: string | Date;
    saleId: string;
    grandTotal: number;
    refundMethod: string;
    branchId?: string;
    items: SalesReturnItem[];
}

interface ProductMeta {
    id: string;
    productName?: string;
    brandId?: string;
    brandName?: string;
    subBrandId?: string;
    supplierId?: string;
}

interface DropdownItem { id: string; name: string }

type DatePreset = "" | "today" | "yesterday" | "last3days" | "last7days" | "lastMonth" | "lastYear" | "singleDay" | "custom";

interface Filters {
    datePreset: DatePreset;
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
    brandName: string;
    subBrandName: string;
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

export interface SubBrandSummary {
    subBrandId: string;
    subBrandName: string;
    brandId: string;
    brandName: string;
    invoiceCount: number;
    grossQty: number;
    grossSales: number;
    returnQty: number;
    returnAmount: number;
    netQty: number;
    netSales: number;
    sharePercent: number;
}

export interface BranchSummary {
    branchId: string;
    branchName: string;
    invoiceCount: number;
    grossQty: number;
    grossSales: number;
    returnQty: number;
    returnAmount: number;
    netQty: number;
    netSales: number;
    sharePercent: number;
}

export interface BrandSummary {
    brandId: string;
    brandName: string;
    grossQty: number;
    grossSales: number;
    returnQty: number;
    returnAmount: number;
    netQty: number;
    netSales: number;
    sharePercent: number;
}

export interface PaymentModeSummary {
    mode: string;
    label: string;
    totalAmount: number;
    count: number;
    sharePercent: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPANY_NAME = "SHAASHOPY";

export const KNOWN_SUB_BRANDS: Record<string, string> = {
    "12ddb083-1517-4928-b2ff-6761d706ebc3": "Shaashopy",
    "f5123e28-12d3-48d8-919d-244d1eeaef8d": "Mehar Hijabs",
    "d727ffde-ff0c-4671-bccb-bbd4acd17511": "Hezak",
    "5c916458-9c91-449b-b451-96dc992965a1": "elyra",
    "5941dd70-84d2-41df-8ee0-498bf5495eeb": "Tharaz",
    "d8233342-438c-4673-a800-4c674887b731": "Calista",
    "78854b35-b423-4048-aac6-4e6b34e526fb": "Shemodesty",
    "010a967b-620f-45c4-bd4b-0e28b64254b6": "Timekeeper",
    "1307f3c1-ad30-427f-9827-e76a558ca00d": "BAITH AL HIJAB",
    "10ca3e61-0100-4374-819f-f852fbb89bbe": "HAYA LIFESTYLE",
    "d2f6b2cb-c4cc-417d-824f-4f94a7ae4bc0": "Pathayam",
    "30d74456-f061-4491-a29a-10f361a0339d": "ELYRA ABAYA",
    "2e9563c1-b326-4cc5-b47f-0a1ef959d879": "MERAKI SISTERS",
    "66c3ed80-86c1-4474-b2f7-7e1d50bc482a": "THARAZ COUTURE",
    "8322d877-7e01-44e3-b858-b05187ad4b8e": "NW JEWELLERY",
    "91e9cc48-f002-4723-b24e-b143b90ee25b": "MALABIS",
    "56a6e407-801f-4b5b-bdd1-273b8b84b97d": "SHAA CALICUT",
};

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
    { value: "singleDay", label: "Specific Date" },
    { value: "custom", label: "Custom Date Range" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const DEFAULT_FILTERS: Filters = {
    datePreset: "",
    from: "", to: "", month: "", year: String(currentYear),
    brandId: "", subBrandId: "", branchId: "", salesmanId: "",
};

function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getPresetDateRange(preset: DatePreset): { from: string; to: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = new Date(today);
    const to = new Date(today);

    switch (preset) {
        case "today":
            break;
        case "yesterday":
            from.setDate(from.getDate() - 1);
            to.setDate(to.getDate() - 1);
            break;
        case "last3days":
            from.setDate(from.getDate() - 2);
            break;
        case "last7days":
            from.setDate(from.getDate() - 6);
            break;
        case "lastMonth":
            from.setFullYear(today.getFullYear(), today.getMonth() - 1, 1);
            to.setFullYear(today.getFullYear(), today.getMonth(), 0);
            break;
        case "lastYear":
            from.setFullYear(today.getFullYear() - 1, 0, 1);
            to.setFullYear(today.getFullYear() - 1, 11, 31);
            break;
        default:
            return { from: "", to: "" };
    }

    return {
        from: formatDateForInput(from),
        to: formatDateForInput(to),
    };
}

function getDateRangeLabel(f: Filters): string {
    if (f.from && f.to) {
        return f.from === f.to ? f.from : `${f.from} to ${f.to}`;
    }
    if (f.from) return `From ${f.from}`;
    if (f.to) return `Until ${f.to}`;
    if (f.month && f.year) {
        const monthName = MONTHS.find((m) => m.value === f.month)?.label ?? f.month;
        return `${monthName} ${f.year}`;
    }
    if (f.year) return `Year ${f.year}`;
    return "All Time";
}

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

// ── Excel Export (Multi-sheet XLSX with Company Name, Brand Name, Date Range) ──

function exportSalesReportToExcel({
    subBrandRows,
    brandRows,
    branchRows,
    paymentRows,
    itemRows,
    subBrandTotals,
    brandTotals,
    branchTotals,
    paymentTotals,
    itemTotals,
    filters,
    branchName,
}: {
    subBrandRows: SubBrandSummary[];
    brandRows: BrandSummary[];
    branchRows: BranchSummary[];
    paymentRows: PaymentModeSummary[];
    itemRows: ReportRow[];
    subBrandTotals: {
        invoiceCount: number;
        grossQty: number;
        grossSales: number;
        returnQty: number;
        returnAmount: number;
        netQty: number;
        netSales: number;
    };
    brandTotals: {
        grossQty: number;
        grossSales: number;
        returnQty: number;
        returnAmount: number;
        netQty: number;
        netSales: number;
    };
    branchTotals: {
        invoiceCount: number;
        grossQty: number;
        grossSales: number;
        returnQty: number;
        returnAmount: number;
        netQty: number;
        netSales: number;
    };
    paymentTotals: { totalAmount: number; count: number };
    itemTotals: { qty: number; amount: number; discount: number; subtotal: number; total: number };
    filters: Filters;
    branchName: string;
}) {
    const dateRangeLabel = getDateRangeLabel(filters);
    const generatedAt = new Date().toLocaleString("en-IN");
    const workbook = XLSX.utils.book_new();

    // ── SHEET 1: Detailed Item Sales ──────────────────────────────────────────
    const itemSheetData: any[][] = [
        [COMPANY_NAME],
        ["ITEM-WISE DETAILED SALES REPORT"],
        [`Date Range Covered: ${dateRangeLabel}`],
        [`Location / Branch: ${branchName}`],
        [`Generated On: ${generatedAt}`],
        [],
        [
            "Sl.No",
            "Invoice No",
            "Date",
            "Brand Name",
            "Sub-Brand",
            "Item Code",
            "Item Name",
            "Qty",
            "Unit",
            "Unit Price (INR)",
            "Gross Amount (INR)",
            "Discount (INR)",
            "Subtotal (INR)",
            "Net Amount (INR)",
            "Customer",
            "Branch",
            "Salesman",
            "Payment Status",
        ],
        ...itemRows.map((r) => [
            r.slNo,
            r.invoiceNo,
            r.date,
            r.brandName,
            r.subBrandName,
            r.itemCode,
            r.itemName,
            r.qty,
            r.baseUnit,
            Number(r.unitPrice.toFixed(2)),
            Number(r.amount.toFixed(2)),
            Number(r.discount.toFixed(2)),
            Number(r.subtotal.toFixed(2)),
            Number(r.total.toFixed(2)),
            r.customerName,
            r.branchName,
            r.salesmanName,
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
            itemTotals.qty,
            "",
            "",
            Number(itemTotals.amount.toFixed(2)),
            Number(itemTotals.discount.toFixed(2)),
            Number(itemTotals.subtotal.toFixed(2)),
            Number(itemTotals.total.toFixed(2)),
            "",
            "",
            "",
            "",
        ],
    ];

    const wsItems = XLSX.utils.aoa_to_sheet(itemSheetData);
    wsItems["!cols"] = [
        { wch: 8 },  // Sl
        { wch: 20 }, // Invoice
        { wch: 14 }, // Date
        { wch: 22 }, // Brand
        { wch: 22 }, // Sub-Brand
        { wch: 16 }, // Code
        { wch: 30 }, // Name
        { wch: 10 }, // Qty
        { wch: 8 },  // Unit
        { wch: 14 }, // Price
        { wch: 16 }, // Gross
        { wch: 14 }, // Discount
        { wch: 16 }, // Subtotal
        { wch: 16 }, // Net Total
        { wch: 20 }, // Customer
        { wch: 18 }, // Branch
        { wch: 18 }, // Salesman
        { wch: 14 }, // Status
    ];
    XLSX.utils.book_append_sheet(workbook, wsItems, "Detailed Item Sales");

    // ── SHEET 2: Sub-Brand Wise Sales Report (Gross, Returns, Net) ──────────────
    const subBrandSheetData: any[][] = [
        [COMPANY_NAME],
        ["SUB-BRAND WISE SALES REPORT (GROSS SALES, SALES RETURNS & NET SALES)"],
        [`Date Range Covered: ${dateRangeLabel}`],
        [`Location / Branch: ${branchName}`],
        [`Generated On: ${generatedAt}`],
        [],
        [
            "Sl.No",
            "Sub-Brand Name",
            "Parent Brand",
            "Invoices Count",
            "Gross Qty Sold",
            "Gross Sales (INR)",
            "Return Qty",
            "Sales Returns (INR)",
            "Net Qty",
            "Net Sales (INR)",
            "Share %",
        ],
        ...subBrandRows.map((sb, idx) => [
            idx + 1,
            sb.subBrandName,
            sb.brandName,
            sb.invoiceCount,
            sb.grossQty,
            Number(sb.grossSales.toFixed(2)),
            sb.returnQty,
            Number(sb.returnAmount.toFixed(2)),
            sb.netQty,
            Number(sb.netSales.toFixed(2)),
            `${sb.sharePercent.toFixed(1)}%`,
        ]),
        [
            "Total",
            "ALL SUB-BRANDS",
            "",
            subBrandTotals.invoiceCount,
            subBrandTotals.grossQty,
            Number(subBrandTotals.grossSales.toFixed(2)),
            subBrandTotals.returnQty,
            Number(subBrandTotals.returnAmount.toFixed(2)),
            subBrandTotals.netQty,
            Number(subBrandTotals.netSales.toFixed(2)),
            "100.0%",
        ],
    ];

    const wsSubBrands = XLSX.utils.aoa_to_sheet(subBrandSheetData);
    wsSubBrands["!cols"] = [
        { wch: 8 },  // Sl
        { wch: 28 }, // Sub-Brand Name
        { wch: 22 }, // Parent Brand
        { wch: 16 }, // Invoices
        { wch: 16 }, // Gross Qty
        { wch: 18 }, // Gross Sales
        { wch: 14 }, // Return Qty
        { wch: 18 }, // Sales Return
        { wch: 14 }, // Net Qty
        { wch: 18 }, // Net Sales
        { wch: 12 }, // Share %
    ];
    XLSX.utils.book_append_sheet(workbook, wsSubBrands, "Sub-Brand-wise Sales");

    // ── SHEET 3: Brand-Wise Sales & Returns ─────────────────────────────────────
    const brandSheetData: any[][] = [
        [COMPANY_NAME],
        ["BRAND-WISE SALES REPORT (GROSS SALES, SALES RETURNS & NET SALES)"],
        [`Date Range Covered: ${dateRangeLabel}`],
        [`Branch: ${branchName}`],
        [`Generated On: ${generatedAt}`],
        [],
        [
            "Sl.No",
            "Brand Name",
            "Gross Qty Sold",
            "Gross Sales (INR)",
            "Return Qty",
            "Sales Returns (INR)",
            "Net Qty",
            "Net Sales (INR)",
            "Share %",
        ],
        ...brandRows.map((b, idx) => [
            idx + 1,
            b.brandName,
            b.grossQty,
            Number(b.grossSales.toFixed(2)),
            b.returnQty,
            Number(b.returnAmount.toFixed(2)),
            b.netQty,
            Number(b.netSales.toFixed(2)),
            `${b.sharePercent.toFixed(1)}%`,
        ]),
        [
            "Total",
            "ALL BRANDS",
            brandTotals.grossQty,
            Number(brandTotals.grossSales.toFixed(2)),
            brandTotals.returnQty,
            Number(brandTotals.returnAmount.toFixed(2)),
            brandTotals.netQty,
            Number(brandTotals.netSales.toFixed(2)),
            "100.0%",
        ],
    ];

    const wsBrands = XLSX.utils.aoa_to_sheet(brandSheetData);
    wsBrands["!cols"] = [
        { wch: 8 },  // Sl
        { wch: 30 }, // Brand Name
        { wch: 16 }, // Gross Qty
        { wch: 18 }, // Gross Sales
        { wch: 14 }, // Return Qty
        { wch: 18 }, // Sales Return
        { wch: 14 }, // Net Qty
        { wch: 18 }, // Net Sales
        { wch: 12 }, // Share %
    ];
    XLSX.utils.book_append_sheet(workbook, wsBrands, "Brand-wise Sales");

    // ── SHEET 4: Branch-Wise Sales & Returns ─────────────────────────────────────
    const branchSheetData: any[][] = [
        [COMPANY_NAME],
        ["BRANCH-WISE SALES REPORT (GROSS SALES, SALES RETURNS & NET SALES)"],
        [`Date Range Covered: ${dateRangeLabel}`],
        [`Location / Branch: ${branchName}`],
        [`Generated On: ${generatedAt}`],
        [],
        [
            "Sl.No",
            "Branch Name",
            "Invoices Count",
            "Gross Qty Sold",
            "Gross Sales (INR)",
            "Return Qty",
            "Sales Returns (INR)",
            "Net Qty",
            "Net Sales (INR)",
            "Share %",
        ],
        ...branchRows.map((b, idx) => [
            idx + 1,
            b.branchName,
            b.invoiceCount,
            b.grossQty,
            Number(b.grossSales.toFixed(2)),
            b.returnQty,
            Number(b.returnAmount.toFixed(2)),
            b.netQty,
            Number(b.netSales.toFixed(2)),
            `${b.sharePercent.toFixed(1)}%`,
        ]),
        [
            "Total",
            "ALL BRANCHES",
            branchTotals.invoiceCount,
            branchTotals.grossQty,
            Number(branchTotals.grossSales.toFixed(2)),
            branchTotals.returnQty,
            Number(branchTotals.returnAmount.toFixed(2)),
            branchTotals.netQty,
            Number(branchTotals.netSales.toFixed(2)),
            "100.0%",
        ],
    ];

    const wsBranches = XLSX.utils.aoa_to_sheet(branchSheetData);
    wsBranches["!cols"] = [
        { wch: 8 },  // Sl
        { wch: 32 }, // Branch Name
        { wch: 16 }, // Invoices
        { wch: 16 }, // Gross Qty
        { wch: 18 }, // Gross Sales
        { wch: 14 }, // Return Qty
        { wch: 18 }, // Sales Return
        { wch: 14 }, // Net Qty
        { wch: 18 }, // Net Sales
        { wch: 12 }, // Share %
    ];
    XLSX.utils.book_append_sheet(workbook, wsBranches, "Branch-wise Sales");

    // ── SHEET 5: Payment Mode Wise Collection Report ───────────────────────────
    const paymentSheetData: any[][] = [
        [COMPANY_NAME],
        ["PAYMENT MODE WISE COLLECTION REPORT"],
        [`Date Range Covered: ${dateRangeLabel}`],
        [`Branch: ${branchName}`],
        [`Generated On: ${generatedAt}`],
        [],
        [
            "Sl.No",
            "Payment Mode",
            "Total Collected (INR)",
            "Transaction Count",
            "Share of Total %",
        ],
        ...paymentRows.map((p, idx) => [
            idx + 1,
            p.label,
            Number(p.totalAmount.toFixed(2)),
            p.count,
            `${p.sharePercent.toFixed(1)}%`,
        ]),
        [
            "Total",
            "ALL MODES",
            Number(paymentTotals.totalAmount.toFixed(2)),
            paymentTotals.count,
            "100.0%",
        ],
    ];

    const wsPayments = XLSX.utils.aoa_to_sheet(paymentSheetData);
    wsPayments["!cols"] = [
        { wch: 8 },  // Sl
        { wch: 25 }, // Payment Mode
        { wch: 22 }, // Amount
        { wch: 18 }, // Count
        { wch: 16 }, // Share %
    ];
    XLSX.utils.book_append_sheet(workbook, wsPayments, "Payment Collections");

    const cleanDateRange = dateRangeLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${COMPANY_NAME}_Sales_Report_${cleanDateRange}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// ── Print Helper ──────────────────────────────────────────────────────────────

function exportToPDF({
    activeView,
    rows,
    totals,
    subBrandRows,
    subBrandTotals,
    brandRows,
    brandTotals,
    branchRows,
    branchTotals,
    paymentRows,
    paymentTotals,
    filters,
}: {
    activeView: "items" | "subbrand" | "brand" | "branch" | "payment";
    rows: ReportRow[];
    totals: { qty: number; amount: number; discount: number; subtotal: number; total: number };
    subBrandRows: SubBrandSummary[];
    subBrandTotals: { invoiceCount: number; grossQty: number; grossSales: number; returnQty: number; returnAmount: number; netQty: number; netSales: number };
    brandRows: BrandSummary[];
    brandTotals: { grossQty: number; grossSales: number; returnQty: number; returnAmount: number; netQty: number; netSales: number };
    branchRows: BranchSummary[];
    branchTotals: { invoiceCount: number; grossQty: number; grossSales: number; returnQty: number; returnAmount: number; netQty: number; netSales: number };
    paymentRows: PaymentModeSummary[];
    paymentTotals: { totalAmount: number; count: number };
    filters: Filters;
}) {
    const dateLabel = getDateRangeLabel(filters);
    let viewTitle = "Detailed Sales Report";
    let tableHtml = "";

    if (activeView === "subbrand") {
        viewTitle = "Sub-Brand Wise Sales Report";
        tableHtml = "<table><thead><tr>" +
          "<th>#</th><th>Sub-Brand Name</th><th>Parent Brand</th><th class='r'>Invoices</th>" +
          "<th class='r'>Gross Qty</th><th class='r'>Gross Sales (₹)</th>" +
          "<th class='r'>Return Qty</th><th class='r'>Sales Return (₹)</th>" +
          "<th class='r'>Net Qty</th><th class='r'>Net Sales (₹)</th><th class='r'>Share %</th>" +
        "</tr></thead><tbody>" +
        subBrandRows.map((sb, idx) => `
        <tr>
          <td>${idx + 1}</td><td>${sb.subBrandName}</td><td>${sb.brandName}</td><td class="r">${sb.invoiceCount}</td>
          <td class="r">${sb.grossQty}</td><td class="r">${sb.grossSales.toFixed(2)}</td>
          <td class="r">${sb.returnQty}</td><td class="r">${sb.returnAmount.toFixed(2)}</td>
          <td class="r">${sb.netQty}</td><td class="r">${sb.netSales.toFixed(2)}</td>
          <td class="r">${sb.sharePercent.toFixed(1)}%</td>
        </tr>`).join("") +
        `<tr class="tot">
          <td colspan="3">TOTAL</td><td class="r">${subBrandTotals.invoiceCount}</td>
          <td class="r">${subBrandTotals.grossQty}</td><td class="r">${subBrandTotals.grossSales.toFixed(2)}</td>
          <td class="r">${subBrandTotals.returnQty}</td><td class="r">${subBrandTotals.returnAmount.toFixed(2)}</td>
          <td class="r">${subBrandTotals.netQty}</td><td class="r">${subBrandTotals.netSales.toFixed(2)}</td>
          <td class="r">100.0%</td>
        </tr></tbody></table>`;
    } else if (activeView === "branch") {
        viewTitle = "Sub-Branch & Branch-Wise Sales Report";
        tableHtml = `<table><thead><tr>
          <th>#</th><th>Branch / Sub-branch Name</th><th class="r">Invoices</th>
          <th class="r">Gross Qty</th><th class="r">Gross Sales (₹)</th>
          <th class="r">Return Qty</th><th class="r">Sales Return (₹)</th>
          <th class="r">Net Qty</th><th class="r">Net Sales (₹)</th><th class="r">Share %</th>
        </tr></thead><tbody>` +
        branchRows.map((b, idx) => `
        <tr>
          <td>${idx + 1}</td><td>${b.branchName}</td><td class="r">${b.invoiceCount}</td>
          <td class="r">${b.grossQty}</td><td class="r">${b.grossSales.toFixed(2)}</td>
          <td class="r">${b.returnQty}</td><td class="r">${b.returnAmount.toFixed(2)}</td>
          <td class="r">${b.netQty}</td><td class="r">${b.netSales.toFixed(2)}</td>
          <td class="r">${b.sharePercent.toFixed(1)}%</td>
        </tr>`).join("") +
        `<tr class="tot">
          <td colspan="2">TOTAL</td><td class="r">${branchTotals.invoiceCount}</td>
          <td class="r">${branchTotals.grossQty}</td><td class="r">${branchTotals.grossSales.toFixed(2)}</td>
          <td class="r">${branchTotals.returnQty}</td><td class="r">${branchTotals.returnAmount.toFixed(2)}</td>
          <td class="r">${branchTotals.netQty}</td><td class="r">${branchTotals.netSales.toFixed(2)}</td>
          <td class="r">100.0%</td>
        </tr></tbody></table>`;
    } else if (activeView === "brand") {
        viewTitle = "Brand-Wise Sales Report";
        tableHtml = `<table><thead><tr>
          <th>#</th><th>Brand Name</th><th class="r">Gross Qty</th><th class="r">Gross Sales (₹)</th>
          <th class="r">Return Qty</th><th class="r">Sales Return (₹)</th><th class="r">Net Qty</th>
          <th class="r">Net Sales (₹)</th><th class="r">Share %</th>
        </tr></thead><tbody>` +
        brandRows.map((b, idx) => `
        <tr>
          <td>${idx + 1}</td><td>${b.brandName}</td><td class="r">${b.grossQty}</td>
          <td class="r">${b.grossSales.toFixed(2)}</td><td class="r">${b.returnQty}</td>
          <td class="r">${b.returnAmount.toFixed(2)}</td><td class="r">${b.netQty}</td>
          <td class="r">${b.netSales.toFixed(2)}</td><td class="r">${b.sharePercent.toFixed(1)}%</td>
        </tr>`).join("") +
        `<tr class="tot">
          <td colspan="2">TOTAL</td><td class="r">${brandTotals.grossQty}</td>
          <td class="r">${brandTotals.grossSales.toFixed(2)}</td><td class="r">${brandTotals.returnQty}</td>
          <td class="r">${brandTotals.returnAmount.toFixed(2)}</td><td class="r">${brandTotals.netQty}</td>
          <td class="r">${brandTotals.netSales.toFixed(2)}</td>
          <td class="r">100.0%</td>
        </tr></tbody></table>`;
    } else if (activeView === "payment") {
        viewTitle = "Payment Mode Wise Collection Report";
        tableHtml = `<table><thead><tr>
          <th>#</th><th>Payment Mode</th><th class="r">Total Collected (₹)</th>
          <th class="r">Transaction Count</th><th class="r">Share %</th>
        </tr></thead><tbody>` +
        paymentRows.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td><td>${p.label}</td><td class="r">${p.totalAmount.toFixed(2)}</td>
          <td class="r">${p.count}</td><td class="r">${p.sharePercent.toFixed(1)}%</td>
        </tr>`).join("") +
        `<tr class="tot">
          <td colspan="2">TOTAL</td><td class="r">${paymentTotals.totalAmount.toFixed(2)}</td>
          <td class="r">${paymentTotals.count}</td><td class="r">100.0%</td>
        </tr></tbody></table>`;
    } else {
        viewTitle = "Detailed Item-Wise Sales Report";
        tableHtml = `<table><thead><tr>
          <th>#</th><th>Invoice</th><th>Date</th><th>Brand</th>
          <th>Code</th><th>Item Name</th><th class="r">Qty</th><th>Unit</th>
          <th class="r">Unit Price</th><th class="r">Amount</th>
          <th class="r">Discount</th><th class="r">Subtotal</th>
          <th class="r">Net Amount</th><th>Customer</th><th>Branch</th><th>Salesman</th><th>Status</th>
        </tr></thead><tbody>` +
        rows.map((r) => `
        <tr>
          <td>${r.slNo}</td><td>${r.invoiceNo}</td><td style="white-space:nowrap">${r.date}</td>
          <td>${r.brandName}</td><td>${r.subBrandName}</td><td>${r.itemCode}</td><td>${r.itemName}</td>
          <td class="r">${r.qty}</td><td>${r.baseUnit}</td>
          <td class="r">${r.unitPrice.toFixed(2)}</td><td class="r">${r.amount.toFixed(2)}</td>
          <td class="r">${r.discount > 0 ? r.discount.toFixed(2) : "—"}</td>
          <td class="r">${r.subtotal.toFixed(2)}</td><td class="r">${r.total.toFixed(2)}</td>
          <td>${r.customerName}</td><td>${r.branchName}</td><td>${r.salesmanName}</td>
          <td><span class="badge ${r.paymentStatus}">${r.paymentStatus}</span></td>
        </tr>`).join("") +
        `<tr class="tot">
          <td colspan="7">Total</td>
          <td class="r">${totals.qty}</td><td></td><td></td>
          <td class="r">${totals.amount.toFixed(2)}</td>
          <td class="r">${totals.discount.toFixed(2)}</td>
          <td class="r">${totals.subtotal.toFixed(2)}</td>
          <td class="r">${totals.total.toFixed(2)}</td>
          <td colspan="4"></td>
        </tr></tbody></table>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${COMPANY_NAME} - ${viewTitle}</title><style>
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
<h1>${COMPANY_NAME} - ${viewTitle}</h1>
<div class="sub">Period: ${dateLabel}&nbsp;·&nbsp;Generated: ${new Date().toLocaleString("en-IN")}</div>
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

export default function SalesReportPage() {
    // "pending" — what the user is editing in the filter UI
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    // "committed" — last state actually sent to the API / used for client filter
    const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

    // View selector: maintains the exact original item view while adding Brand-wise & Payment view
    const [activeView, setActiveView] = useState<"items" | "subbrand" | "brand" | "branch" | "payment">("items");

    // Raw records from API
    const [rawSales, setRawSales] = useState<Sale[]>([]);
    const [rawReturns, setRawReturns] = useState<SalesReturn[]>([]);
    const [allRows, setAllRows] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [mastersLoading, setMastersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dropdown lists
    const [allBrandsWithSubBrands, setAllBrandsWithSubBrands] = useState<BrandType[]>([]);
    const [brands, setBrands] = useState<DropdownItem[]>([]);
    const [subBrands, setSubBrands] = useState<DropdownItem[]>([]);
    const [branches, setBranches] = useState<DropdownItem[]>([]);
    const [salesmen, setSalesmen] = useState<DropdownItem[]>([]);

    // productId → { brandId, subBrandId, supplierId } built from sale item payloads
    const [productMap, setProductMap] = useState<Map<string, ProductMeta>>(new Map());

    // Sub-brand metadata map (subBrandId -> { id, name, brandId, brandName })
    const subBrandMetaMap = useMemo(() => {
        const map = new Map<string, { id: string; name: string; brandId: string; brandName: string }>();
        
        // Baseline: seed all known sub-brands
        Object.entries(KNOWN_SUB_BRANDS).forEach(([id, name]) => {
            map.set(id, {
                id,
                name,
                brandId: "481ebb5b-1861-4ee8-89f4-4b556a731e59",
                brandName: "SHAASHOPY",
            });
        });

        // Dynamic: overlay from allBrandsWithSubBrands
        allBrandsWithSubBrands.forEach((b) => {
            (b.subBrands ?? []).forEach((sb) => {
                map.set(sb.id, {
                    id: sb.id,
                    name: sb.name,
                    brandId: b.id,
                    brandName: b.name,
                });
            });
        });

        // Dynamic: overlay from subBrands dropdown
        subBrands.forEach((sb) => {
            if (!map.has(sb.id) || !map.get(sb.id)?.name) {
                const parentBrand = brands.find((b) => b.id === appliedFilters.brandId);
                map.set(sb.id, {
                    id: sb.id,
                    name: sb.name,
                    brandId: appliedFilters.brandId || "481ebb5b-1861-4ee8-89f4-4b556a731e59",
                    brandName: parentBrand?.name || "SHAASHOPY",
                });
            }
        });
        return map;
    }, [allBrandsWithSubBrands, subBrands, brands, appliedFilters.brandId]);

    // Brand name lookup
    const brandNameMap = useMemo(() => {
        const map = new Map<string, string>();
        brands.forEach((b) => map.set(b.id, b.name));
        return map;
    }, [brands]);

    // Active branch name
    const activeBranchName = useMemo(() => {
        if (!appliedFilters.branchId) return "All Branches";
        const b = branches.find((br) => br.id === appliedFilters.branchId);
        return b ? b.name : "SHAASHOPY CHEMMAD";
    }, [appliedFilters.branchId, branches]);

    // ── Load dropdowns once ────────────────────────────────────────────────────
    useEffect(() => {
        async function loadMasters() {
            setMastersLoading(true);
            try {
                const [b, br, usersRes, brandsWithSubs] = await Promise.all([
                    getBrandListForDropdown(),
                    getBranchListForDropdown(),
                    getUserList(),
                    getBrandListWithSubBrands(),
                ]);
                const users: any[] = Array.isArray(usersRes) ? usersRes : (usersRes as any)?.data ?? [];
                setBrands(b);
                setBranches(br);
                setAllBrandsWithSubBrands(brandsWithSubs);
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
        if (f.from && !f.to) return { from: f.from, to: f.from };
        if (!f.from && f.to) return { from: f.to, to: f.to };
        if (f.month && f.year) {
            const y = Number(f.year), m = Number(f.month);
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

    function toApiDateBoundary(value: string, endOfDay = false) {
        if (!value) return undefined;
        const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
        return new Date(`${value}T${time}`).toISOString();
    }

    // ── API fetch (sales + sales returns) ──────────────────────────────────────
    const fetchReport = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const { from, to } = buildDateRange(f);

            if (from && to && from > to) {
                setError("From date cannot be later than To date.");
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
                    limit: 500,
                    page: 1,
                }),
                getSalesReturnList({
                    page: 1,
                    limit: 500,
                    branchId: f.branchId || undefined,
                    from: apiFrom,
                    to: apiTo,
                }).catch(() => null),
            ]);

            if ('error' in salesRes) {
                setError(salesRes.error ?? 'Failed to load report');
                return;
            }

            const sales: Sale[] = salesRes.sales ?? [];
            const returns: SalesReturn[] = (returnsRes?.data?.returns ?? []) as any[];

            setRawSales(sales);
            setRawReturns(returns);

            // Build product→meta map
            const newMap = new Map<string, ProductMeta>();
            for (const sale of sales) {
                for (const item of sale.items ?? []) {
                    if (item.product && !newMap.has(item.productId)) {
                        const bName = item.product.brand?.name ||
                            (item.product.brandId ? brandNameMap.get(item.product.brandId) : undefined);

                        newMap.set(item.productId, {
                            id: item.productId,
                            productName: item.product.productName,
                            brandId: item.product.brandId,
                            brandName: bName,
                            subBrandId: item.product.subBrandId,
                            supplierId: item.product.supplierId,
                        });
                    }
                }
            }
            setProductMap(newMap);

            // Flatten sales → line item rows
            const rows: ReportRow[] = [];
            let sl = 1;
            for (const sale of sales) {
                if (!Array.isArray(sale.items)) continue;
                const d = new Date(sale.salesDate);
                const year = d.getFullYear();
                const month = d.toLocaleString("en-IN", { month: "long" });
                const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                for (const item of sale.items) {
                    const bId = item.product?.brandId;
                    const bName = item.product?.brand?.name ||
                        (bId ? brandNameMap.get(bId) : undefined) || "Unbranded";

                    const pMeta = productMap.get(item.productId);
                    const sbId = item.product?.subBrandId ?? pMeta?.subBrandId;
                    const sbName = subBrandMetaMap.get(sbId || "")?.name || (sbId ? `Sub-brand ${sbId.slice(0, 6)}` : "—");

                    rows.push({
                        slNo: sl++,
                        invoiceNo: sale.invoiceNo,
                        date: dateStr,
                        year,
                        month,
                        brandName: bName,
                        subBrandName: sbName,
                        itemCode: item.product?.sku ?? item.productId,
                        itemName: item.product?.productName ?? "—",
                        qty: item.quantity,
                        baseUnit: "PCs",
                        unitPrice: Number(item.unitPrice),
                        amount: Number(item.unitPrice) * item.quantity,
                        discount: Number(item.discount),
                        subtotal: Number(item.subtotal),
                        total: Number(item.total),
                        customerName: sale.customer?.name ?? "—",
                        branchName: sale.branch?.name ?? "—",
                        salesmanName: sale.salesman?.name ?? "—",
                        salesmanId: sale.salesman?.id ?? sale.salesmanId ?? "",
                        paymentStatus: sale.paymentStatus,
                        productId: item.productId,
                    });
                }
            }
            setAllRows(rows);
        } catch (e: any) {
            setError(e.message ?? "Failed to load report");
        } finally {
            setLoading(false);
        }
    }, [brandNameMap]);

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

    // ── Brand-Wise Aggregations (Gross Sales, Sales Returns, Net Sales) ──────────
    const brandSummaryRows: BrandSummary[] = useMemo(() => {
        const brandMap = new Map<string, {
            brandId: string;
            brandName: string;
            grossQty: number;
            grossSales: number;
            returnQty: number;
            returnAmount: number;
        }>();

        // Seed all active brands from master
        brands.forEach((b) => {
            brandMap.set(b.id, {
                brandId: b.id,
                brandName: b.name,
                grossQty: 0,
                grossSales: 0,
                returnQty: 0,
                returnAmount: 0,
            });
        });

        // Accumulate Gross Sales by Brand
        for (const sale of rawSales) {
            if (appliedFilters.salesmanId && sale.salesmanId !== appliedFilters.salesmanId) continue;
            for (const item of sale.items ?? []) {
                const pMeta = productMap.get(item.productId);
                const bId = item.product?.brandId || pMeta?.brandId || "unbranded";
                const bName = item.product?.brand?.name || pMeta?.brandName || brandNameMap.get(bId) || (bId === "unbranded" ? "Unbranded / General" : "Brand " + bId.slice(0, 6));

                if (!brandMap.has(bId)) {
                    brandMap.set(bId, {
                        brandId: bId,
                        brandName: bName,
                        grossQty: 0,
                        grossSales: 0,
                        returnQty: 0,
                        returnAmount: 0,
                    });
                }
                const entry = brandMap.get(bId)!;
                entry.grossQty += Number(item.quantity || 0);
                entry.grossSales += Number(item.total ?? item.subtotal ?? 0);
            }
        }

        // Accumulate Sales Returns by Brand
        for (const ret of rawReturns) {
            for (const rItem of ret.items ?? []) {
                const pMeta = productMap.get(rItem.productId);
                const bId = rItem.product?.brandId || pMeta?.brandId || "unbranded";
                const bName = rItem.product?.brand?.name || pMeta?.brandName || brandNameMap.get(bId) || (bId === "unbranded" ? "Unbranded / General" : "Brand " + bId.slice(0, 6));

                if (!brandMap.has(bId)) {
                    brandMap.set(bId, {
                        brandId: bId,
                        brandName: bName,
                        grossQty: 0,
                        grossSales: 0,
                        returnQty: 0,
                        returnAmount: 0,
                    });
                }
                const entry = brandMap.get(bId)!;
                entry.returnQty += Number(rItem.quantity || 0);
                entry.returnAmount += Number(rItem.total ?? rItem.subtotal ?? 0);
            }
        }

        let list = Array.from(brandMap.values());
        if (appliedFilters.brandId) {
            list = list.filter((b) => b.brandId === appliedFilters.brandId);
        } else {
            list = list.filter((b) => b.grossSales > 0 || b.returnAmount > 0 || b.grossQty > 0);
        }

        const totalGross = list.reduce((s, b) => s + b.grossSales, 0);

        return list.map((b) => ({
            ...b,
            netQty: b.grossQty - b.returnQty,
            netSales: b.grossSales - b.returnAmount,
            sharePercent: totalGross > 0 ? (b.grossSales / totalGross) * 100 : 0,
        })).sort((a, b) => b.grossSales - a.grossSales);
    }, [rawSales, rawReturns, brands, brandNameMap, productMap, appliedFilters]);

    const brandTotals = useMemo(() => {
        return brandSummaryRows.reduce((acc, b) => ({
            grossQty: acc.grossQty + b.grossQty,
            grossSales: acc.grossSales + b.grossSales,
            returnQty: acc.returnQty + b.returnQty,
            returnAmount: acc.returnAmount + b.returnAmount,
            netQty: acc.netQty + b.netQty,
            netSales: acc.netSales + b.netSales,
        }), { grossQty: 0, grossSales: 0, returnQty: 0, returnAmount: 0, netQty: 0, netSales: 0 });
    }, [brandSummaryRows]);

    // ── Sub-Brand Wise Aggregations (Gross Sales, Sales Returns, Net Sales) ──
    const subBrandSummaryRows: SubBrandSummary[] = useMemo(() => {
        const sbMap = new Map<string, {
            subBrandId: string;
            subBrandName: string;
            brandId: string;
            brandName: string;
            invoiceCount: number;
            grossQty: number;
            grossSales: number;
            returnQty: number;
            returnAmount: number;
        }>();

        // Seed all known sub-brands from master so EVERY sub-brand is represented
        subBrandMetaMap.forEach((meta) => {
            if (appliedFilters.brandId && meta.brandId && meta.brandId !== appliedFilters.brandId) return;
            sbMap.set(meta.id, {
                subBrandId: meta.id,
                subBrandName: meta.name,
                brandId: meta.brandId,
                brandName: meta.brandName,
                invoiceCount: 0,
                grossQty: 0,
                grossSales: 0,
                returnQty: 0,
                returnAmount: 0,
            });
        });

        // Accumulate Gross Sales by Sub-Brand
        for (const sale of rawSales) {
            if (appliedFilters.salesmanId && sale.salesmanId !== appliedFilters.salesmanId) continue;
            if (appliedFilters.branchId && (sale.branch?.id || (sale as any).branchId) !== appliedFilters.branchId) continue;

            const touchedInSale = new Set<string>();

            for (const item of sale.items ?? []) {
                const pMeta = productMap.get(item.productId);
                const sbId = item.product?.subBrandId || pMeta?.subBrandId || "unbranded_sub";
                const sbMeta = subBrandMetaMap.get(sbId);
                const bId = item.product?.brandId || pMeta?.brandId || sbMeta?.brandId || "unbranded";

                if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
                if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

                const sbName = sbMeta?.name || (sbId === "unbranded_sub" ? "General / Direct" : `Sub-brand ${sbId.slice(0, 6)}`);
                const bName = sbMeta?.brandName || item.product?.brand?.name || brandNameMap.get(bId) || "SHAASHOPY";

                if (!sbMap.has(sbId)) {
                    sbMap.set(sbId, {
                        subBrandId: sbId,
                        subBrandName: sbName,
                        brandId: bId,
                        brandName: bName,
                        invoiceCount: 0,
                        grossQty: 0,
                        grossSales: 0,
                        returnQty: 0,
                        returnAmount: 0,
                    });
                }

                const entry = sbMap.get(sbId)!;
                entry.grossQty += Number(item.quantity || 0);
                entry.grossSales += Number(item.total ?? item.subtotal ?? 0);
                touchedInSale.add(sbId);
            }

            touchedInSale.forEach((sbId) => {
                if (sbMap.has(sbId)) {
                    sbMap.get(sbId)!.invoiceCount += 1;
                }
            });
        }

        // Accumulate Sales Returns by Sub-Brand
        for (const ret of rawReturns) {
            if (appliedFilters.branchId && ((ret as any).branch?.id || ret.branchId) !== appliedFilters.branchId) continue;

            for (const rItem of ret.items ?? []) {
                const pMeta = productMap.get(rItem.productId);
                const sbId = rItem.product?.subBrandId || pMeta?.subBrandId || "unbranded_sub";
                const sbMeta = subBrandMetaMap.get(sbId);
                const bId = rItem.product?.brandId || pMeta?.brandId || sbMeta?.brandId || "unbranded";

                if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
                if (appliedFilters.subBrandId && sbId !== appliedFilters.subBrandId) continue;

                const sbName = sbMeta?.name || (sbId === "unbranded_sub" ? "General / Direct" : `Sub-brand ${sbId.slice(0, 6)}`);
                const bName = sbMeta?.brandName || rItem.product?.brand?.name || brandNameMap.get(bId) || "SHAASHOPY";

                if (!sbMap.has(sbId)) {
                    sbMap.set(sbId, {
                        subBrandId: sbId,
                        subBrandName: sbName,
                        brandId: bId,
                        brandName: bName,
                        invoiceCount: 0,
                        grossQty: 0,
                        grossSales: 0,
                        returnQty: 0,
                        returnAmount: 0,
                    });
                }

                const entry = sbMap.get(sbId)!;
                entry.returnQty += Number(rItem.quantity || 0);
                entry.returnAmount += Number(rItem.total ?? rItem.subtotal ?? 0);
            }
        }

        let list = Array.from(sbMap.values());
        if (appliedFilters.subBrandId) {
            list = list.filter((s) => s.subBrandId === appliedFilters.subBrandId);
        } else {
            // Show all sub-brands under selected brand or with activity
            const activeList = list.filter((s) => s.grossSales > 0 || s.returnAmount > 0 || s.grossQty > 0 || s.invoiceCount > 0);
            list = activeList.length > 0 ? activeList : list;
        }

        const totalNetSales = list.reduce((s, b) => s + (b.grossSales - b.returnAmount), 0);

        return list.map((b) => {
            const netSales = b.grossSales - b.returnAmount;
            return {
                ...b,
                netQty: b.grossQty - b.returnQty,
                netSales,
                sharePercent: totalNetSales > 0 ? (netSales / totalNetSales) * 100 : 0,
            };
        }).sort((a, b) => b.netSales - a.netSales || b.subBrandName.localeCompare(a.subBrandName));
    }, [rawSales, rawReturns, subBrandMetaMap, brandNameMap, productMap, appliedFilters]);

    const subBrandTotals = useMemo(() => {
        return subBrandSummaryRows.reduce(
            (acc, b) => ({
                invoiceCount: acc.invoiceCount + b.invoiceCount,
                grossQty: acc.grossQty + b.grossQty,
                grossSales: acc.grossSales + b.grossSales,
                returnQty: acc.returnQty + b.returnQty,
                returnAmount: acc.returnAmount + b.returnAmount,
                netQty: acc.netQty + b.netQty,
                netSales: acc.netSales + b.netSales,
            }),
            { invoiceCount: 0, grossQty: 0, grossSales: 0, returnQty: 0, returnAmount: 0, netQty: 0, netSales: 0 },
        );
    }, [subBrandSummaryRows]);

    // ── Branch / Sub-Branch Wise Aggregations (Gross Sales, Sales Returns, Net Sales) ──
    const branchSummaryRows: BranchSummary[] = useMemo(() => {
        const branchMap = new Map<string, {
            branchId: string;
            branchName: string;
            invoiceCount: number;
            grossQty: number;
            grossSales: number;
            returnQty: number;
            returnAmount: number;
        }>();

        // Seed all registered branches from master
        branches.forEach((b) => {
            branchMap.set(b.id, {
                branchId: b.id,
                branchName: b.name,
                invoiceCount: 0,
                grossQty: 0,
                grossSales: 0,
                returnQty: 0,
                returnAmount: 0,
            });
        });

        // Accumulate Gross Sales by Branch / Sub-Branch
        for (const sale of rawSales) {
            if (appliedFilters.salesmanId && sale.salesmanId !== appliedFilters.salesmanId) continue;

            const brId = sale.branch?.id || (sale as any).branchId || "default";
            const brName = sale.branch?.name || (branches.find((b) => b.id === brId)?.name) || (brId === "default" ? "Main Branch" : `Branch ${brId.slice(0, 6)}`);

            if (!branchMap.has(brId)) {
                branchMap.set(brId, {
                    branchId: brId,
                    branchName: brName,
                    invoiceCount: 0,
                    grossQty: 0,
                    grossSales: 0,
                    returnQty: 0,
                    returnAmount: 0,
                });
            }

            const entry = branchMap.get(brId)!;
            entry.invoiceCount += 1;

            for (const item of sale.items ?? []) {
                const pMeta = productMap.get(item.productId);
                const bId = item.product?.brandId || pMeta?.brandId;
                if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
                if (appliedFilters.subBrandId && pMeta?.subBrandId !== appliedFilters.subBrandId) continue;

                entry.grossQty += Number(item.quantity || 0);
                entry.grossSales += Number(item.total ?? item.subtotal ?? 0);
            }
        }

        // Accumulate Sales Returns by Branch / Sub-Branch
        for (const ret of rawReturns) {
            const brId = (ret as any).branch?.id || ret.branchId || (ret as any).sale?.branchId || "default";
            const brName = (ret as any).branch?.name || (ret as any).sale?.branch?.name || (branches.find((b) => b.id === brId)?.name) || (brId === "default" ? "Main Branch" : `Branch ${brId.slice(0, 6)}`);

            if (!branchMap.has(brId)) {
                branchMap.set(brId, {
                    branchId: brId,
                    branchName: brName,
                    invoiceCount: 0,
                    grossQty: 0,
                    grossSales: 0,
                    returnQty: 0,
                    returnAmount: 0,
                });
            }

            const entry = branchMap.get(brId)!;

            for (const rItem of ret.items ?? []) {
                const pMeta = productMap.get(rItem.productId);
                const bId = rItem.product?.brandId || pMeta?.brandId;
                if (appliedFilters.brandId && bId !== appliedFilters.brandId) continue;
                if (appliedFilters.subBrandId && pMeta?.subBrandId !== appliedFilters.subBrandId) continue;

                entry.returnQty += Number(rItem.quantity || 0);
                entry.returnAmount += Number(rItem.total ?? rItem.subtotal ?? 0);
            }
        }

        let list = Array.from(branchMap.values());
        if (appliedFilters.branchId) {
            list = list.filter((b) => b.branchId === appliedFilters.branchId);
        } else {
            const activeList = list.filter((b) => b.grossSales > 0 || b.returnAmount > 0 || b.grossQty > 0 || b.invoiceCount > 0);
            list = activeList.length > 0 ? activeList : list;
        }

        const totalNetSales = list.reduce((s, b) => s + (b.grossSales - b.returnAmount), 0);

        return list.map((b) => {
            const netSales = b.grossSales - b.returnAmount;
            return {
                ...b,
                netQty: b.grossQty - b.returnQty,
                netSales,
                sharePercent: totalNetSales > 0 ? (netSales / totalNetSales) * 100 : 0,
            };
        }).sort((a, b) => b.netSales - a.netSales);
    }, [rawSales, rawReturns, branches, appliedFilters, productMap]);

    const branchTotals = useMemo(() => {
        return branchSummaryRows.reduce(
            (acc, b) => ({
                invoiceCount: acc.invoiceCount + b.invoiceCount,
                grossQty: acc.grossQty + b.grossQty,
                grossSales: acc.grossSales + b.grossSales,
                returnQty: acc.returnQty + b.returnQty,
                returnAmount: acc.returnAmount + b.returnAmount,
                netQty: acc.netQty + b.netQty,
                netSales: acc.netSales + b.netSales,
            }),
            { invoiceCount: 0, grossQty: 0, grossSales: 0, returnQty: 0, returnAmount: 0, netQty: 0, netSales: 0 },
        );
    }, [branchSummaryRows]);

    // ── Payment Mode Wise Collections ──────────────────────────────────────────
    const paymentModeRows: PaymentModeSummary[] = useMemo(() => {
        const modeMap = new Map<string, { label: string; totalAmount: number; count: number }>();
        const LABEL_MAP: Record<string, string> = {
            CASH: "Cash Payment",
            CARD: "Credit / Debit Card",
            UPI: "UPI / Digital Wallet",
            BANK: "Bank Transfer",
            BANK_TRANSFER: "Bank Transfer",
            CHEQUE: "Cheque",
            OTHER: "Other Modes",
        };

        ["CASH", "CARD", "UPI", "BANK_TRANSFER"].forEach((m) => {
            modeMap.set(m, { label: LABEL_MAP[m] || m, totalAmount: 0, count: 0 });
        });

        for (const sale of rawSales) {
            if (appliedFilters.salesmanId && sale.salesmanId !== appliedFilters.salesmanId) continue;
            for (const p of sale.payments ?? []) {
                const key = String(p.paymentMethod || "CASH").toUpperCase();
                const amt = Number(p.amount || 0);
                if (amt <= 0) continue;

                if (!modeMap.has(key)) {
                    modeMap.set(key, { label: LABEL_MAP[key] || key, totalAmount: 0, count: 0 });
                }
                const entry = modeMap.get(key)!;
                entry.totalAmount += amt;
                entry.count += 1;
            }
        }

        const totalCollected = Array.from(modeMap.values()).reduce((s, p) => s + p.totalAmount, 0);

        return Array.from(modeMap.entries()).map(([mode, data]) => ({
            mode,
            label: data.label,
            totalAmount: data.totalAmount,
            count: data.count,
            sharePercent: totalCollected > 0 ? (data.totalAmount / totalCollected) * 100 : 0,
        })).filter(p => p.totalAmount > 0 || ["CASH", "CARD", "UPI"].includes(p.mode))
          .sort((a, b) => b.totalAmount - a.totalAmount);
    }, [rawSales, appliedFilters.salesmanId]);

    const paymentTotals = useMemo(() => {
        return paymentModeRows.reduce((acc, p) => ({
            totalAmount: acc.totalAmount + p.totalAmount,
            count: acc.count + p.count,
        }), { totalAmount: 0, count: 0 });
    }, [paymentModeRows]);

    // ── Date preset + filter setters ───────────────────────────────────────────
    function setDatePreset(value: string) {
        const datePreset = value as DatePreset;

        setFilters((prev) => {
            if (!datePreset) {
                return {
                    ...prev,
                    datePreset: "",
                    from: "",
                    to: "",
                };
            }

            if (datePreset === "singleDay" || datePreset === "custom") {
                return {
                    ...prev,
                    datePreset,
                    from: "",
                    to: "",
                    month: "",
                    year: "",
                };
            }

            const range = getPresetDateRange(datePreset);
            return {
                ...prev,
                datePreset,
                ...range,
                month: "",
                year: "",
            };
        });
    }

    function setSingleDay(value: string) {
        setFilters((prev) => ({
            ...prev,
            datePreset: "singleDay",
            from: value,
            to: value,
            month: "",
            year: "",
        }));
    }

    function setFilter(key: keyof Filters, value: string) {
        setFilters((prev) => {
            const next = { ...prev, [key]: value };
            if (key === "brandId") next.subBrandId = "";
            if (key === "month" || key === "year") {
                next.datePreset = "";
                next.from = "";
                next.to = "";
            }
            if (key === "from" || key === "to") {
                next.datePreset = "custom";
                next.month = "";
                next.year = "";
            }
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

    // ── Trigger Excel Export ───────────────────────────────────────────────────
    const handleExportExcel = () => {
        exportSalesReportToExcel({
            subBrandRows: subBrandSummaryRows,
            brandRows: brandSummaryRows,
            branchRows: branchSummaryRows,
            paymentRows: paymentModeRows,
            itemRows: rows,
            subBrandTotals,
            brandTotals,
            branchTotals,
            paymentTotals,
            itemTotals: totals,
            filters: appliedFilters,
            branchName: activeBranchName,
        });
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
                            onClick={handleExportExcel}
                        >
                            <FileSpreadsheet className="h-4 w-4" /> Export Excel
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => exportToPDF({
                            activeView,
                            rows,
                            totals,
                            subBrandRows: subBrandSummaryRows,
                            subBrandTotals,
                            brandRows: brandSummaryRows,
                            brandTotals,
                            branchRows: branchSummaryRows,
                            branchTotals,
                            paymentRows: paymentModeRows,
                            paymentTotals,
                            filters: appliedFilters,
                        })}
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

                        {filters.datePreset === "singleDay" && (
                            <DateInput
                                label="Date"
                                value={filters.from}
                                onChange={setSingleDay}
                            />
                        )}

                        {filters.datePreset === "custom" && (
                            <>
                                <DateInput label="From" value={filters.from} onChange={(v) => setFilter("from", v)} />
                                <DateInput label="To" value={filters.to} onChange={(v) => setFilter("to", v)} />
                            </>
                        )}

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
                            label={mastersLoading ? "Branch / Sub-branch (loading…)" : "Branch / Sub-branch"}
                            value={filters.branchId}
                            onChange={(v) => setFilter("branchId", v)}
                            options={branches.map((b) => ({ value: b.id, label: b.name }))}
                            placeholder="All Branches & Sub-branches"
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

            {/* Summary cards - original card style maintained + Gross, Returns & Net sales */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: "Total Lines", value: rows.length.toString() },
                        { label: "Total Qty", value: totals.qty.toString() },
                        { label: "Gross Sales", value: formatCurrency(totals.amount) },
                        { label: "Sales Returns", value: formatCurrency(brandTotals.returnAmount) },
                        { label: "Net Sales", value: formatCurrency(totals.total - brandTotals.returnAmount) },
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

            {/* View Selector Tabs (New Feature without altering the original card theme) */}
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
                        Detailed Item Sales ({rows.length})
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
                        Sub-Brand Sales ({subBrandSummaryRows.length})
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
                        Brand Sales ({brandSummaryRows.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView("branch")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            activeView === "branch"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Building2 className="h-3.5 w-3.5" />
                        Branch Sales ({branchSummaryRows.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView("payment")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            activeView === "payment"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <CreditCard className="h-3.5 w-3.5" />
                        Payment Mode Collections ({paymentModeRows.length})
                    </button></div>

                <div className="text-xs text-muted-foreground">
                    Date Range: <span className="font-semibold text-foreground">{getDateRangeLabel(appliedFilters)}</span>
                </div>
            </div>

            {/* ── VIEW 1: SUB-BRAND WISE SALES REPORT (Gross Sales, Sales Return, Net Sales) ── */}
            {activeView === "subbrand" && (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Sub-Brand Name</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Gross Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Gross Sales (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Return Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Sales Return (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Net Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">Net Sales (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Share %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subBrandSummaryRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                                            No sub-brand sales recorded for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    subBrandSummaryRows.map((sb, idx) => (
                                        <tr key={sb.subBrandId} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2 font-semibold text-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Tags className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span>{sb.subBrandName}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">{sb.grossQty}</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(sb.grossSales)}</td>
                                            <td className="px-3 py-2 text-right text-rose-600 font-medium">
                                                {sb.returnQty > 0 ? `-${sb.returnQty}` : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right text-rose-600 font-medium">
                                                {sb.returnAmount > 0 ? `-${formatCurrency(sb.returnAmount)}` : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{sb.netQty}</td>
                                            <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(sb.netSales)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium">{sb.sharePercent.toFixed(1)}%</td>
                                        </tr>
                                    ))
                                )}

                                {/* Grand Totals row */}
                                {subBrandSummaryRows.length > 0 && (
                                    <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                                        <td colSpan={2} className="px-3 py-2.5">Total (All Sub-Brands)</td>
                                        <td className="px-3 py-2.5 text-right">{subBrandTotals.grossQty}</td>
                                        <td className="px-3 py-2.5 text-right">{formatCurrency(subBrandTotals.grossSales)}</td>
                                        <td className="px-3 py-2.5 text-right text-rose-600">
                                            {subBrandTotals.returnQty > 0 ? `-${subBrandTotals.returnQty}` : "0"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-rose-600">
                                            {subBrandTotals.returnAmount > 0 ? `-${formatCurrency(subBrandTotals.returnAmount)}` : formatCurrency(0)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">{subBrandTotals.netQty}</td>
                                        <td className="px-3 py-2.5 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                                            {formatCurrency(subBrandTotals.netSales)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">100.0%</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* ── VIEW 2: BRAND-WISE SALES REPORT (Gross Sales, Sales Return, Net Sales) ── */}
            {activeView === "brand" && (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Brand Name</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Gross Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Gross Sales (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Return Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Sales Return (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Net Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">Net Sales (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Share %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brandSummaryRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                                            No brand data found for current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    brandSummaryRows.map((b, idx) => (
                                        <tr key={b.brandId} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2 font-medium text-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span>{b.brandName}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">{b.grossQty}</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(b.grossSales)}</td>
                                            <td className="px-3 py-2 text-right text-rose-600 font-medium">
                                                {b.returnQty > 0 ? `-${b.returnQty}` : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right text-rose-600 font-medium">
                                                {b.returnAmount > 0 ? `-${formatCurrency(b.returnAmount)}` : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{b.netQty}</td>
                                            <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(b.netSales)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium">{b.sharePercent.toFixed(1)}%</td>
                                        </tr>
                                    ))
                                )}

                                {/* Grand Totals row */}
                                {brandSummaryRows.length > 0 && (
                                    <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                                        <td colSpan={2} className="px-3 py-2.5">Total (All Brands)</td>
                                        <td className="px-3 py-2.5 text-right">{brandTotals.grossQty}</td>
                                        <td className="px-3 py-2.5 text-right">{formatCurrency(brandTotals.grossSales)}</td>
                                        <td className="px-3 py-2.5 text-right text-rose-600">
                                            {brandTotals.returnQty > 0 ? `-${brandTotals.returnQty}` : "0"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-rose-600">
                                            {brandTotals.returnAmount > 0 ? `-${formatCurrency(brandTotals.returnAmount)}` : formatCurrency(0)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">{brandTotals.netQty}</td>
                                        <td className="px-3 py-2.5 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                                            {formatCurrency(brandTotals.netSales)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">100.0%</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* ── VIEW 3: BRANCH SALES REPORT ── */}
            {activeView === "branch" && (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Branch Name</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Invoices</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Gross Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Gross Sales (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Return Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600">Sales Return (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Net Qty</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">Net Sales (₹)</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Share %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchSummaryRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                                            No sales recorded for branches in the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    branchSummaryRows.map((b, idx) => (
                                        <tr key={b.branchId} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="font-semibold">{b.branchName}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">{b.invoiceCount}</td>
                                            <td className="px-3 py-2 text-right">{b.grossQty}</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(b.grossSales)}</td>
                                            <td className="px-3 py-2 text-right text-rose-600 font-medium">
                                                {b.returnQty > 0 ? `-${b.returnQty}` : "0"}
                                            </td>
                                            <td className="px-3 py-2 text-right text-rose-600 font-medium">
                                                {b.returnAmount > 0 ? `-${formatCurrency(b.returnAmount)}` : formatCurrency(0)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{b.netQty}</td>
                                            <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(b.netSales)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{b.sharePercent.toFixed(1)}%</td>
                                        </tr>
                                    ))
                                )}

                                {/* Totals row */}
                                {branchSummaryRows.length > 0 && (
                                    <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                                        <td colSpan={2} className="px-3 py-2.5">Total (All Branches)</td>
                                        <td className="px-3 py-2.5 text-right">{branchTotals.invoiceCount}</td>
                                        <td className="px-3 py-2.5 text-right">{branchTotals.grossQty}</td>
                                        <td className="px-3 py-2.5 text-right">{formatCurrency(branchTotals.grossSales)}</td>
                                        <td className="px-3 py-2.5 text-right text-rose-600">
                                            {branchTotals.returnQty > 0 ? `-${branchTotals.returnQty}` : "0"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-rose-600">
                                            {branchTotals.returnAmount > 0 ? `-${formatCurrency(branchTotals.returnAmount)}` : formatCurrency(0)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">{branchTotals.netQty}</td>
                                        <td className="px-3 py-2.5 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(branchTotals.netSales)}</td>
                                        <td className="px-3 py-2.5 text-right">100.0%</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* ── VIEW 4: PAYMENT MODE WISE COLLECTION REPORT ── */}
            {activeView === "payment" && (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                                    <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Payment Mode</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Total Collections</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Transaction Count</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Average / Transaction</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Share % of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentModeRows.map((p, idx) => (
                                    <tr key={p.mode} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                        <td className="px-3 py-2 font-medium">{p.label}</td>
                                        <td className="px-3 py-2 text-right font-bold text-foreground">{formatCurrency(p.totalAmount)}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{p.count}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">
                                            {p.count > 0 ? formatCurrency(p.totalAmount / p.count) : "—"}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold">{p.sharePercent.toFixed(1)}%</td>
                                    </tr>
                                ))}

                                {/* Totals row */}
                                <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                                    <td colSpan={2} className="px-3 py-2.5">Total Collections</td>
                                    <td className="px-3 py-2.5 text-right font-bold">{formatCurrency(paymentTotals.totalAmount)}</td>
                                    <td className="px-3 py-2.5 text-right">{paymentTotals.count}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        {paymentTotals.count > 0 ? formatCurrency(paymentTotals.totalAmount / paymentTotals.count) : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-right">100.0%</td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* ── VIEW 5: DETAILED ITEM-WISE SALES TABLE ── */}
            {activeView === "items" && (
                loading ? (
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
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/60 text-muted-foreground text-xs">
                                        <th className="px-3 py-2.5 text-left font-semibold">Sl.No</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Invoice No</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Brand</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Sub-Brand</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Code</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Item Name</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
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
                                    {rows.map((r) => (
                                        <tr key={r.slNo} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 text-muted-foreground">{r.slNo}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{r.invoiceNo}</td>
                                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{r.date}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.brandName}</td>
                                            <td className="px-3 py-2 font-medium text-foreground">{r.subBrandName}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{r.itemCode}</td>
                                            <td className="px-3 py-2 font-medium">{r.itemName}</td>
                                            <td className="px-3 py-2 text-right">{r.qty}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(r.unitPrice)}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(r.amount)}</td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">
                                                {r.discount > 0 ? formatCurrency(r.discount) : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(r.subtotal)}</td>
                                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(r.total)}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.customerName}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.branchName}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.salesmanName}</td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                                        statusColor[r.paymentStatus] ?? "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {r.paymentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Grand Totals row */}
                                    <tr className="border-t-2 bg-muted/60 font-semibold text-sm">
                                        <td colSpan={7} className="px-3 py-2.5">Total</td>
                                        <td className="px-3 py-2.5 text-right">{totals.qty}</td>
                                        <td className="px-3 py-2.5 text-right"></td>
                                        <td className="px-3 py-2.5 text-right">{formatCurrency(totals.amount)}</td>
                                        <td className="px-3 py-2.5 text-right">{formatCurrency(totals.discount)}</td>
                                        <td className="px-3 py-2.5 text-right">{formatCurrency(totals.subtotal)}</td>
                                        <td className="px-3 py-2.5 text-right font-bold">{formatCurrency(totals.total)}</td>
                                        <td colSpan={4}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )
            )}
</div>
    );
}
