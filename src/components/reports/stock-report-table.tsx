"use client";

import { useState } from "react";
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
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, Filter } from "lucide-react";
import { StockReportItem } from "@/actions/stock-report-actions";
import { formatCurrency } from "@/lib/utils";

interface StockReportTableProps {
  data: StockReportItem[];
}

export function StockReportTable({ data }: StockReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const [locationFilter, setLocationFilter] = useState("all");
  const [sortField, setSortField] =
    useState<keyof StockReportItem>("product_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Get unique categories and locations for filters

  const locations = [...new Set(data.map((item) => item.location))];

  // Filter and sort data
  const filteredData = data
    .filter((item) => {
      const matchesSearch =
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        !locationFilter ||
        locationFilter === "all" ||
        item.location === locationFilter;

      return matchesSearch && matchesLocation;
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

  const handleSort = (field: keyof StockReportItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "SKU",
      "Product",
      "Variation",

      "Location",
      "Unit Selling Price",
      "Current Stock",
      "Current Stock Value (Purchase)",
      "Current Stock Value (Sale)",
      "Potential Profit",
      "Total Unit Sold",
    ];

    const csvData = filteredData.map((item) => [
      item.sku,
      item.product_name,
      item.variation || "",

      item.location,
      item.unit_selling_price,
      item.current_stock,
      item.current_stock_value_purchase,
      item.current_stock_value_sale,
      item.potential_profit,
      item.total_unit_sold,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const totalStockValue = filteredData.reduce(
    (sum, item) => sum + item.current_stock_value_purchase,
    0,
  );
  const totalPotentialProfit = filteredData.reduce(
    (sum, item) => sum + item.potential_profit,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stock Report Filters</span>
            <div className="flex gap-2">
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
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
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

      {/* Stock Report Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                    onClick={() => handleSort("variation")}
                  >
                    Variation{" "}
                    {sortField === "variation" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>

                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("location")}
                  >
                    Location{" "}
                    {sortField === "location" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("unit_selling_price")}
                  >
                    Unit Selling Price{" "}
                    {sortField === "unit_selling_price" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("current_stock")}
                  >
                    Current Stock{" "}
                    {sortField === "current_stock" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("current_stock_value_purchase")}
                  >
                    Stock Value (Purchase){" "}
                    {sortField === "current_stock_value_purchase" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("current_stock_value_sale")}
                  >
                    Stock Value (Sale){" "}
                    {sortField === "current_stock_value_sale" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("potential_profit")}
                  >
                    Potential Profit{" "}
                    {sortField === "potential_profit" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort("total_unit_sold")}
                  >
                    Total Unit Sold{" "}
                    {sortField === "total_unit_sold" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-center">
                      {item.variation || "-"}
                    </TableCell>

                    <TableCell className="text-center">
                      {item.location}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(item.unit_selling_price)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.current_stock} {item.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(item.current_stock_value_purchase)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(item.current_stock_value_sale)}
                    </TableCell>
                    <TableCell
                      className={`text-center ${item.potential_profit >= 0
                          ? "text-green-600"
                          : "text-red-600"
                        }`}
                    >
                      {formatCurrency(item.potential_profit)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.total_unit_sold} {item.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
