"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Tag,
  Tags,
  Layers,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { StockReportItem } from "@/actions/stock-report-actions";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";

interface StockReportTableProps {
  data: StockReportItem[];
}

type ViewMode = "detailed" | "brand" | "subbrand" | "branch";
type StockFilterType = "all" | "positive" | "zero" | "negative";

export function StockReportTable({ data }: StockReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<StockFilterType>("all");
  const [activeView, setActiveView] = useState<ViewMode>("detailed");

  // Sorting
  const [sortField, setSortField] = useState<keyof StockReportItem>("product_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Unique locations for filter
  const locations = useMemo(
    () => [...new Set(data.map((item) => item.location).filter(Boolean))],
    [data]
  );

  // Filter products by search, location, and stock status
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          !query ||
          item.product_name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          (item.brand_name && item.brand_name.toLowerCase().includes(query)) ||
          (item.sub_brand_name && item.sub_brand_name.toLowerCase().includes(query));

        const matchesLocation =
          !locationFilter ||
          locationFilter === "all" ||
          item.location === locationFilter;

        let matchesStock = true;
        if (stockStatusFilter === "positive") {
          matchesStock = item.current_stock > 0;
        } else if (stockStatusFilter === "zero") {
          matchesStock = item.current_stock === 0;
        } else if (stockStatusFilter === "negative") {
          matchesStock = item.current_stock < 0;
        }

        return matchesSearch && matchesLocation && matchesStock;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
  }, [data, searchTerm, locationFilter, stockStatusFilter, sortField, sortDirection]);

  // Overall calculations
  const totalStockValue = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.current_stock_value_purchase, 0),
    [filteredData]
  );

  const totalSaleValue = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.current_stock_value_sale, 0),
    [filteredData]
  );

  const totalPotentialProfit = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.potential_profit, 0),
    [filteredData]
  );

  const totalCurrentStockUnits = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.current_stock, 0),
    [filteredData]
  );

  const totalUnitsSold = useMemo(
    () => filteredData.reduce((sum, item) => sum + (item.total_unit_sold || 0), 0),
    [filteredData]
  );

  // Stock health counts (calculated over data matching location & search)
  const stockHealth = useMemo(() => {
    let positiveCount = 0;
    let positiveUnits = 0;
    let zeroCount = 0;
    let negativeCount = 0;
    let negativeUnits = 0;

    for (const item of filteredData) {
      if (item.current_stock > 0) {
        positiveCount++;
        positiveUnits += item.current_stock;
      } else if (item.current_stock === 0) {
        zeroCount++;
      } else {
        negativeCount++;
        negativeUnits += item.current_stock;
      }
    }

    return {
      positiveCount,
      positiveUnits,
      zeroCount,
      negativeCount,
      negativeUnits,
    };
  }, [filteredData]);

  // Brand-wise aggregation
  const brandSummaryRows = useMemo(() => {
    const map = new Map<
      string,
      {
        brandName: string;
        productsCount: number;
        totalStock: number;
        purchaseValue: number;
        saleValue: number;
        potentialProfit: number;
      }
    >();

    for (const item of filteredData) {
      const bName = item.brand_name || "Unbranded";
      const existing = map.get(bName) || {
        brandName: bName,
        productsCount: 0,
        totalStock: 0,
        purchaseValue: 0,
        saleValue: 0,
        potentialProfit: 0,
      };

      existing.productsCount += 1;
      existing.totalStock += item.current_stock;
      existing.purchaseValue += item.current_stock_value_purchase;
      existing.saleValue += item.current_stock_value_sale;
      existing.potentialProfit += item.potential_profit;

      map.set(bName, existing);
    }

    const rows = Array.from(map.values()).sort(
      (a, b) => b.purchaseValue - a.purchaseValue
    );

    return rows.map((r) => ({
      ...r,
      sharePercent:
        totalStockValue > 0 ? (r.purchaseValue / totalStockValue) * 100 : 0,
    }));
  }, [filteredData, totalStockValue]);

  // Sub-brand-wise aggregation
  const subBrandSummaryRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        brandName: string;
        subBrandName: string;
        productsCount: number;
        totalStock: number;
        purchaseValue: number;
        saleValue: number;
        potentialProfit: number;
      }
    >();

    for (const item of filteredData) {
      const bName = item.brand_name || "Unbranded";
      const sbName = item.sub_brand_name || "—";
      const key = `${bName}:::${sbName}`;

      const existing = map.get(key) || {
        key,
        brandName: bName,
        subBrandName: sbName,
        productsCount: 0,
        totalStock: 0,
        purchaseValue: 0,
        saleValue: 0,
        potentialProfit: 0,
      };

      existing.productsCount += 1;
      existing.totalStock += item.current_stock;
      existing.purchaseValue += item.current_stock_value_purchase;
      existing.saleValue += item.current_stock_value_sale;
      existing.potentialProfit += item.potential_profit;

      map.set(key, existing);
    }

    const rows = Array.from(map.values()).sort(
      (a, b) => b.purchaseValue - a.purchaseValue
    );

    return rows.map((r) => ({
      ...r,
      sharePercent:
        totalStockValue > 0 ? (r.purchaseValue / totalStockValue) * 100 : 0,
    }));
  }, [filteredData, totalStockValue]);

  // Branch-wise aggregation
  const branchSummaryRows = useMemo(() => {
    const map = new Map<
      string,
      {
        location: string;
        productsCount: number;
        totalStock: number;
        positiveCount: number;
        zeroCount: number;
        negativeCount: number;
        purchaseValue: number;
        saleValue: number;
        potentialProfit: number;
      }
    >();

    for (const item of filteredData) {
      const loc = item.location || "Main Location";
      const existing = map.get(loc) || {
        location: loc,
        productsCount: 0,
        totalStock: 0,
        positiveCount: 0,
        zeroCount: 0,
        negativeCount: 0,
        purchaseValue: 0,
        saleValue: 0,
        potentialProfit: 0,
      };

      existing.productsCount += 1;
      existing.totalStock += item.current_stock;
      if (item.current_stock > 0) existing.positiveCount++;
      else if (item.current_stock === 0) existing.zeroCount++;
      else existing.negativeCount++;

      existing.purchaseValue += item.current_stock_value_purchase;
      existing.saleValue += item.current_stock_value_sale;
      existing.potentialProfit += item.potential_profit;

      map.set(loc, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.purchaseValue - a.purchaseValue
    );
  }, [filteredData]);

  const handleSort = (field: keyof StockReportItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Comprehensive Multi-sheet Excel Export
  const exportToExcel = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const generatedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const branchLabel = locationFilter === "all" ? "All Locations" : locationFilter;

    const workbook = XLSX.utils.book_new();

    // 1. Detailed Sheet
    const detailedHeader = [
      ["SHAA INVENTORY"],
      ["INVENTORY STOCK REPORT & VALUATION (DETAILED ITEMS)"],
      [`Location Scope: ${branchLabel}`],
      [`Generated On: ${generatedAt}`],
      [],
      [
        "Sl.No",
        "SKU",
        "Product Name",
        "Brand",
        "Sub-Brand",
        "Variation",
        "Location",
        "Unit Selling Price",
        "Available Stock",
        "Unit",
        "Stock Value (Purchase)",
        "Stock Value (Sale)",
        "Potential Profit",
        "Total Sold",
        "Stock Status",
      ],
    ];

    const detailedRows = filteredData.map((item, idx) => [
      idx + 1,
      item.sku,
      item.product_name,
      item.brand_name || "Unbranded",
      item.sub_brand_name || "—",
      item.variation || "-",
      item.location,
      Number(item.unit_selling_price.toFixed(2)),
      item.current_stock,
      item.unit,
      Number(item.current_stock_value_purchase.toFixed(2)),
      Number(item.current_stock_value_sale.toFixed(2)),
      Number(item.potential_profit.toFixed(2)),
      item.total_unit_sold,
      item.current_stock > 0
        ? "In Stock"
        : item.current_stock === 0
        ? "Zero Stock"
        : "Negative Stock",
    ]);

    const detailedFooter = [
      [
        "Total",
        "",
        `Total Products: ${filteredData.length}`,
        "",
        "",
        "",
        "",
        "",
        totalCurrentStockUnits,
        "",
        Number(totalStockValue.toFixed(2)),
        Number(totalSaleValue.toFixed(2)),
        Number(totalPotentialProfit.toFixed(2)),
        totalUnitsSold,
        "",
      ],
    ];

    const wsDetailed = XLSX.utils.aoa_to_sheet([
      ...detailedHeader,
      ...detailedRows,
      ...detailedFooter,
    ]);
    wsDetailed["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 32 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 8 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsDetailed, "Detailed Stock");

    // 2. Brand Valuation Sheet
    const brandHeader = [
      ["SHAA INVENTORY"],
      ["BRAND-WISE STOCK REPORT & VALUATION"],
      [`Location Scope: ${branchLabel}`],
      [`Generated On: ${generatedAt}`],
      [],
      [
        "Sl.No",
        "Brand Name",
        "Products Count",
        "Total Stock Qty",
        "Stock Value (Purchase)",
        "Stock Value (Sale)",
        "Potential Profit",
        "Inventory Share %",
      ],
    ];

    const brandRows = brandSummaryRows.map((b, idx) => [
      idx + 1,
      b.brandName,
      b.productsCount,
      b.totalStock,
      Number(b.purchaseValue.toFixed(2)),
      Number(b.saleValue.toFixed(2)),
      Number(b.potentialProfit.toFixed(2)),
      `${b.sharePercent.toFixed(1)}%`,
    ]);

    const brandFooter = [
      [
        "Total",
        "ALL BRANDS",
        filteredData.length,
        totalCurrentStockUnits,
        Number(totalStockValue.toFixed(2)),
        Number(totalSaleValue.toFixed(2)),
        Number(totalPotentialProfit.toFixed(2)),
        "100.0%",
      ],
    ];

    const wsBrand = XLSX.utils.aoa_to_sheet([
      ...brandHeader,
      ...brandRows,
      ...brandFooter,
    ]);
    wsBrand["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsBrand, "Brand Valuation");

    // 3. Sub-Brand Valuation Sheet
    const subBrandHeader = [
      ["SHAA INVENTORY"],
      ["SUB-BRAND-WISE STOCK REPORT & VALUATION"],
      [`Location Scope: ${branchLabel}`],
      [`Generated On: ${generatedAt}`],
      [],
      [
        "Sl.No",
        "Brand Name",
        "Sub-Brand Name",
        "Products Count",
        "Total Stock Qty",
        "Stock Value (Purchase)",
        "Stock Value (Sale)",
        "Potential Profit",
        "Inventory Share %",
      ],
    ];

    const subBrandRows = subBrandSummaryRows.map((sb, idx) => [
      idx + 1,
      sb.brandName,
      sb.subBrandName,
      sb.productsCount,
      sb.totalStock,
      Number(sb.purchaseValue.toFixed(2)),
      Number(sb.saleValue.toFixed(2)),
      Number(sb.potentialProfit.toFixed(2)),
      `${sb.sharePercent.toFixed(1)}%`,
    ]);

    const subBrandFooter = [
      [
        "Total",
        "ALL SUB-BRANDS",
        "",
        filteredData.length,
        totalCurrentStockUnits,
        Number(totalStockValue.toFixed(2)),
        Number(totalSaleValue.toFixed(2)),
        Number(totalPotentialProfit.toFixed(2)),
        "100.0%",
      ],
    ];

    const wsSubBrand = XLSX.utils.aoa_to_sheet([
      ...subBrandHeader,
      ...subBrandRows,
      ...subBrandFooter,
    ]);
    wsSubBrand["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsSubBrand, "Sub-Brand Valuation");

    // 4. Branch Summary Sheet
    const branchHeader = [
      ["SHAA INVENTORY"],
      ["BRANCH-WISE STOCK REPORT & VALUATION SUMMARY"],
      [`Generated On: ${generatedAt}`],
      [],
      [
        "Sl.No",
        "Branch / Location",
        "Products Count",
        "Total Stock Qty",
        "Positive Stock Items",
        "Zero Stock Items",
        "Negative Stock Items",
        "Stock Value (Purchase)",
        "Stock Value (Sale)",
        "Potential Profit",
      ],
    ];

    const branchRows = branchSummaryRows.map((br, idx) => [
      idx + 1,
      br.location,
      br.productsCount,
      br.totalStock,
      br.positiveCount,
      br.zeroCount,
      br.negativeCount,
      Number(br.purchaseValue.toFixed(2)),
      Number(br.saleValue.toFixed(2)),
      Number(br.potentialProfit.toFixed(2)),
    ]);

    const branchFooter = [
      [
        "Total",
        "ALL LOCATIONS",
        filteredData.length,
        totalCurrentStockUnits,
        stockHealth.positiveCount,
        stockHealth.zeroCount,
        stockHealth.negativeCount,
        Number(totalStockValue.toFixed(2)),
        Number(totalSaleValue.toFixed(2)),
        Number(totalPotentialProfit.toFixed(2)),
      ],
    ];

    const wsBranch = XLSX.utils.aoa_to_sheet([
      ...branchHeader,
      ...branchRows,
      ...branchFooter,
    ]);
    wsBranch["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsBranch, "Branch Summary");

    // Write file
    XLSX.writeFile(workbook, `stock-report-${dateStr}.xlsx`);
  };

  // CSV Fallback export
  const exportToCSV = () => {
    const headers = [
      "SKU",
      "Product",
      "Brand",
      "Sub-Brand",
      "Variation",
      "Location",
      "Unit Selling Price",
      "Current Stock",
      "Unit",
      "Stock Value (Purchase)",
      "Stock Value (Sale)",
      "Potential Profit",
      "Total Unit Sold",
    ];

    const csvData = filteredData.map((item) => [
      item.sku,
      item.product_name,
      item.brand_name || "",
      item.sub_brand_name || "",
      item.variation || "",
      item.location,
      item.unit_selling_price,
      item.current_stock,
      item.unit,
      item.current_stock_value_purchase,
      item.current_stock_value_sale,
      item.potential_profit,
      item.total_unit_sold,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Filters Card - Strict Visual Continuity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stock Report Filters</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Export Excel
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setLocationFilter("all");
                setStockStatusFilter("all");
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. 3 Hero Summary Cards - Exact Match to Screenshot */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm font-medium">
              Total Products
            </div>
            <div className="text-2xl font-bold">{filteredData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm font-medium">
              Total Stock Value
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStockValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm font-medium">
              Potential Profit
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPotentialProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Stock Health Indicators Strip (Positive, Zero, Negative Stock) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Stock Quantities:
          </span>
          <button
            type="button"
            onClick={() =>
              setStockStatusFilter(
                stockStatusFilter === "positive" ? "all" : "positive"
              )
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              stockStatusFilter === "positive"
                ? "bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}
            title="Click to filter positive stock"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Positive Stock:</span>
            <span className="font-semibold">{stockHealth.positiveCount} items</span>
            <span className="text-muted-foreground">({stockHealth.positiveUnits} units)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setStockStatusFilter(
                stockStatusFilter === "zero" ? "all" : "zero"
              )
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              stockStatusFilter === "zero"
                ? "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-amber-50/70 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
            }`}
            title="Click to filter zero stock"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Zero Stock:</span>
            <span className="font-semibold">{stockHealth.zeroCount} items</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setStockStatusFilter(
                stockStatusFilter === "negative" ? "all" : "negative"
              )
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              stockStatusFilter === "negative"
                ? "bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                : "bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
            title="Click to filter negative stock"
          >
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Negative Stock:</span>
            <span className="font-semibold">{stockHealth.negativeCount} items</span>
            {stockHealth.negativeUnits < 0 && (
              <span className="text-muted-foreground">
                ({stockHealth.negativeUnits} units)
              </span>
            )}
          </button>

          {stockStatusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setStockStatusFilter("all")}
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* 4. Segmented View Switcher Tabs (Consistent with Vercel UI) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="inline-flex p-1 bg-muted rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveView("detailed")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === "detailed"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Detailed Stock ({filteredData.length})
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
            Brand Valuation ({brandSummaryRows.length})
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
            Sub-Brand Valuation ({subBrandSummaryRows.length})
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
            Branch Summary ({branchSummaryRows.length})
          </button>
        </div>
      </div>

      {/* 5. Active View Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* VIEW 1: DETAILED STOCK (Default) */}
            {activeView === "detailed" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSort("sku")}
                    >
                      SKU{" "}
                      {sortField === "sku" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSort("product_name")}
                    >
                      Product{" "}
                      {sortField === "product_name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSort("brand_name")}
                    >
                      Brand{" "}
                      {sortField === "brand_name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("sub_brand_name")}
                    >
                      Sub-Brand{" "}
                      {sortField === "sub_brand_name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("variation")}
                    >
                      Variation{" "}
                      {sortField === "variation" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("location")}
                    >
                      Location{" "}
                      {sortField === "location" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("unit_selling_price")}
                    >
                      Unit Selling Price{" "}
                      {sortField === "unit_selling_price" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("current_stock")}
                    >
                      Available Stock{" "}
                      {sortField === "current_stock" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("current_stock_value_purchase")}
                    >
                      Stock Value (Purchase){" "}
                      {sortField === "current_stock_value_purchase" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("current_stock_value_sale")}
                    >
                      Stock Value (Sale){" "}
                      {sortField === "current_stock_value_sale" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("potential_profit")}
                    >
                      Potential Profit{" "}
                      {sortField === "potential_profit" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer text-center"
                      onClick={() => handleSort("total_unit_sold")}
                    >
                      Total Unit Sold{" "}
                      {sortField === "total_unit_sold" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No products match the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {item.sku}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {item.product_name}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {item.brand_name || "—"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs">
                          {item.sub_brand_name || "—"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.variation || "-"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.location}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {formatCurrency(item.unit_selling_price)}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.current_stock > 0
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : item.current_stock === 0
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                            }`}
                          >
                            {item.current_stock} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(item.current_stock_value_purchase)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(item.current_stock_value_sale)}
                        </TableCell>
                        <TableCell
                          className={`text-center font-medium ${
                            item.potential_profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(item.potential_profit)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.total_unit_sold} {item.unit}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {filteredData.length > 0 && (
                  <TableFooter>
                    <TableRow className="font-semibold bg-muted/60">
                      <TableCell colSpan={7} className="text-left font-bold">
                        Total ({filteredData.length} Products)
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {totalCurrentStockUnits}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalStockValue)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalSaleValue)}
                      </TableCell>
                      <TableCell
                        className={`text-center font-bold ${
                          totalPotentialProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(totalPotentialProfit)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {totalUnitsSold}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}

            {/* VIEW 2: BRAND VALUATION */}
            {activeView === "brand" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sl.No</TableHead>
                    <TableHead>Brand Name</TableHead>
                    <TableHead className="text-center">Products Count</TableHead>
                    <TableHead className="text-center">Available Stock Qty</TableHead>
                    <TableHead className="text-center">Stock Value (Purchase)</TableHead>
                    <TableHead className="text-center">Stock Value (Sale)</TableHead>
                    <TableHead className="text-center">Potential Profit</TableHead>
                    <TableHead className="text-center">Share %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandSummaryRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No brand data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    brandSummaryRows.map((b, idx) => (
                      <TableRow key={b.brandName}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {b.brandName}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {b.productsCount}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {b.totalStock}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(b.purchaseValue)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(b.saleValue)}
                        </TableCell>
                        <TableCell
                          className={`text-center font-semibold ${
                            b.potentialProfit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(b.potentialProfit)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {b.sharePercent.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {brandSummaryRows.length > 0 && (
                  <TableFooter>
                    <TableRow className="font-semibold bg-muted/60">
                      <TableCell colSpan={2} className="font-bold">
                        Total ({brandSummaryRows.length} Brands)
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {filteredData.length}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {totalCurrentStockUnits}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalStockValue)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalSaleValue)}
                      </TableCell>
                      <TableCell
                        className={`text-center font-bold ${
                          totalPotentialProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(totalPotentialProfit)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        100.0%
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}

            {/* VIEW 3: SUB-BRAND VALUATION */}
            {activeView === "subbrand" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sl.No</TableHead>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Sub-Brand Name</TableHead>
                    <TableHead className="text-center">Products Count</TableHead>
                    <TableHead className="text-center">Available Stock Qty</TableHead>
                    <TableHead className="text-center">Stock Value (Purchase)</TableHead>
                    <TableHead className="text-center">Stock Value (Sale)</TableHead>
                    <TableHead className="text-center">Potential Profit</TableHead>
                    <TableHead className="text-center">Share %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subBrandSummaryRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No sub-brand data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subBrandSummaryRows.map((sb, idx) => (
                      <TableRow key={sb.key}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {sb.brandName}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {sb.subBrandName}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {sb.productsCount}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {sb.totalStock}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(sb.purchaseValue)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(sb.saleValue)}
                        </TableCell>
                        <TableCell
                          className={`text-center font-semibold ${
                            sb.potentialProfit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(sb.potentialProfit)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {sb.sharePercent.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {subBrandSummaryRows.length > 0 && (
                  <TableFooter>
                    <TableRow className="font-semibold bg-muted/60">
                      <TableCell colSpan={3} className="font-bold">
                        Total ({subBrandSummaryRows.length} Sub-Brands)
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {filteredData.length}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {totalCurrentStockUnits}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalStockValue)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalSaleValue)}
                      </TableCell>
                      <TableCell
                        className={`text-center font-bold ${
                          totalPotentialProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(totalPotentialProfit)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        100.0%
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}

            {/* VIEW 4: BRANCH SUMMARY */}
            {activeView === "branch" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sl.No</TableHead>
                    <TableHead>Branch / Location</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Total Stock Qty</TableHead>
                    <TableHead className="text-center text-emerald-600">In Stock (&gt;0)</TableHead>
                    <TableHead className="text-center text-amber-600">Zero Stock (0)</TableHead>
                    <TableHead className="text-center text-rose-600">Negative (&lt;0)</TableHead>
                    <TableHead className="text-center">Stock Value (Purchase)</TableHead>
                    <TableHead className="text-center">Stock Value (Sale)</TableHead>
                    <TableHead className="text-center">Potential Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchSummaryRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No branch data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    branchSummaryRows.map((br, idx) => (
                      <TableRow key={br.location}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {br.location}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {br.productsCount}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {br.totalStock}
                        </TableCell>
                        <TableCell className="text-center text-emerald-700 font-semibold">
                          {br.positiveCount}
                        </TableCell>
                        <TableCell className="text-center text-amber-700 font-semibold">
                          {br.zeroCount}
                        </TableCell>
                        <TableCell className="text-center text-rose-700 font-semibold">
                          {br.negativeCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(br.purchaseValue)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(br.saleValue)}
                        </TableCell>
                        <TableCell
                          className={`text-center font-semibold ${
                            br.potentialProfit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(br.potentialProfit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {branchSummaryRows.length > 0 && (
                  <TableFooter>
                    <TableRow className="font-semibold bg-muted/60">
                      <TableCell colSpan={2} className="font-bold">
                        Total ({branchSummaryRows.length} Locations)
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {filteredData.length}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {totalCurrentStockUnits}
                      </TableCell>
                      <TableCell className="text-center font-bold text-emerald-700">
                        {stockHealth.positiveCount}
                      </TableCell>
                      <TableCell className="text-center font-bold text-amber-700">
                        {stockHealth.zeroCount}
                      </TableCell>
                      <TableCell className="text-center font-bold text-rose-700">
                        {stockHealth.negativeCount}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalStockValue)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(totalSaleValue)}
                      </TableCell>
                      <TableCell
                        className={`text-center font-bold ${
                          totalPotentialProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(totalPotentialProfit)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
