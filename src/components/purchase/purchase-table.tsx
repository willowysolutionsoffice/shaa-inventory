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
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
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
    // Search by purchaseNo or supplier name
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

            {/* Filter by backend PaymentStatus enum */}
            <Select
              onValueChange={(value) =>
                table.setColumnFilters((prev) => [
                  ...prev.filter((f) => f.id !== "paymentStatus"),
                  {
                    id:    "paymentStatus",
                    value: value === "all" ? undefined : value,
                  },
                ])
              }
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
                <TableCell colSpan={5} />
                <TableCell className="border-r-2 text-center font-semibold">
                  Totals
                </TableCell>
                <TableCell className="border-r-2 text-center">
                  Due: {formatCurrency(totals?.dueAmount ?? 0)}
                </TableCell>
                <TableCell colSpan={2}>
                  Grand Total: {formatCurrency(totals?.totalAmount ?? 0)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}