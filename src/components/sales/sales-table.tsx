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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

import { SaleTableProps } from "@/types/sales";
import { Search } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ExportListPdfButton } from "../common/export-list-pdf-button";



interface SalesTableProps<TData> extends SaleTableProps<TData> {
  metadata: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    grandTotal: number;
    dueAmount: number;
    paidAmount: number;
  };
}

export function SalesTable<TValue>({
  columns,
  data,
  metadata,
  totals,
}: SalesTableProps<TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const invoiceNo = row.getValue("invoiceNo") as string;
      const customer = row.original?.customer?.name || "";
      const filter = String(filterValue || "").toLowerCase();
      return (
        invoiceNo?.toLowerCase().includes(filter) ||
        customer?.toLowerCase().includes(filter)
      );
    },
    manualPagination: true,
    pageCount: metadata.totalPages,
  });



  return (
    <div className="flex flex-col gap-5">
      {/* <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Search sales by invoice or customer
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-3">
            <div className="w-full">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Filter by Payment Status
              </label>
              <Select
                onValueChange={(value) =>
                  table.setColumnFilters((prev) => [
                    ...prev.filter((f) => f.id !== "salePaymentStatus"),
                    {
                      id: "salePaymentStatus",
                      value: value === "all" ? undefined : value,
                    },
                  ])
                }
                defaultValue="all"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Due">Due</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card> */}

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Sales</CardTitle>
            <CardDescription>A list of all sales</CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <ExportListPdfButton data={data} type="sales" />
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search by Ref no or customer"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="bg-primary text-primary-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter className="bg-muted/50 border-t text-sm font-medium">

              <TableRow>
                <TableCell colSpan={6} />
                <TableCell className="border-r-2 text-center">
                  Grand Total:
                </TableCell>
                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totals.paidAmount)}
                </TableCell>
                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totals.dueAmount)}
                </TableCell>
                <TableCell colSpan={2} className="border-r-2">
                  {formatCurrency(totals.grandTotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>

      </Card>
    </div>
  );
}
