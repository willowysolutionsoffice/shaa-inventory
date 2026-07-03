"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";
import { PurchaseTableProps as PurchaseTablePropsType } from "@/types/purchase";
import { formatCurrency } from "@/lib/utils";
import { ExportListPdfButton } from "../common/export-list-pdf-button";

interface PurchaseTableProps<TData> extends PurchaseTablePropsType<TData> {
  metadata: {
    totalPages:  number;
    totalCount:  number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    totalAmount: number;
    dueAmount:   number;
    paidAmount:  number;
  };
}

export function PurchaseTable<TValue>({
  columns,
  data,
  metadata,
  totals,
}: PurchaseTableProps<TValue>) {
  const [sorting,       setSorting]       = useState<SortingState>([]);
  const [globalFilter,  setGlobalFilter]  = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange:       setSorting,
    onGlobalFilterChange:  setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel:       getCoreRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    state: { sorting, globalFilter, columnFilters },
    globalFilterFn: (row, _columnId, filterValue) => {
      const purchaseNo = (row.getValue("purchaseNo") as string) ?? "";
      const supplier   = (row.original as any)?.supplier?.name ?? "";
      const filter     = String(filterValue ?? "").toLowerCase();
      return (
        purchaseNo.toLowerCase().includes(filter) ||
        supplier.toLowerCase().includes(filter)
      );
    },
    manualPagination: true,
    pageCount: metadata.totalPages,
  });

  const colCount = columns.length;

  // FIX: the footer must account for exactly `colCount` columns of width.
  // We reserve the last 4 columns for the "Totals / Paid / Due / Grand Total"
  // labels, so the leading spacer only needs to cover the rest.
  // Previously this was `colCount - 3`, which produced one extra cell
  // (10 cells across 9 columns) and pushed the table out of alignment,
  // causing the inner horizontal scrollbar you saw.
  const FOOTER_LABEL_CELLS = 4; // Totals | Paid | Due | Grand Total
  const leadingSpan = Math.max(colCount - FOOTER_LABEL_CELLS, 1);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Purchases</CardTitle>
            <CardDescription>A list of all purchases</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 md:w-auto">
            <ExportListPdfButton data={data} type="purchases" />

            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by purchase no or supplier"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              onValueChange={(value) => {
                setColumnFilters((prev) => {
                  const rest = prev.filter((f) => f.id !== "paymentStatus");
                  if (value === "all") return rest;
                  return [...rest, { id: "paymentStatus", value }];
                });
              }}
              defaultValue="all"
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* FIX: single scroll container around header+body+footer so all
              three stay pinned to the same column widths instead of
              scrolling independently / misaligning */}
          <div className="w-full overflow-x-auto rounded-md border">
            <Table className="min-w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="bg-primary text-primary-foreground whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={colCount} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="bg-muted/50 border-t text-sm font-medium">
                <TableRow>
                  <TableCell colSpan={leadingSpan} />
                  <TableCell className="border-r-2 text-center font-semibold whitespace-nowrap">
                    Totals
                  </TableCell>
                  <TableCell className="border-r-2 text-center whitespace-nowrap">
                    Paid: {formatCurrency(totals?.paidAmount ?? 0)}
                  </TableCell>
                  <TableCell className="border-r-2 text-center text-destructive whitespace-nowrap">
                    Due: {formatCurrency(totals?.dueAmount ?? 0)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    Grand Total: {formatCurrency((totals?.paidAmount ?? 0) + (totals?.dueAmount ?? 0))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}