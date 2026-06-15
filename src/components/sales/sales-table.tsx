"use client";

// src/components/sales/sales-table.tsx

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
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { SaleTableProps } from "@/types/sales";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ExportListPdfButton } from "../common/export-list-pdf-button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// ── Extended props ─────────────────────────────────────────────────────────────

interface SalesTableProps<TData> extends SaleTableProps<TData> {
  metadata: {
    totalPages:  number;
    totalCount:  number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    grandTotal: number;
    dueAmount:  number;
    paidAmount: number;
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SalesTable<TValue>({
  columns, data, metadata, totals,
}: SalesTableProps<TValue>) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

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
    globalFilterFn: (row, _colId, filterValue) => {
      const inv      = String(row.getValue("invoiceNo") ?? "").toLowerCase();
      const customer = String(row.original?.customer?.name ?? "").toLowerCase();
      const q        = String(filterValue ?? "").toLowerCase();
      return inv.includes(q) || customer.includes(q);
    },
    manualPagination: true,
    pageCount:        metadata.totalPages,
  });

  // ── URL-driven pagination ──────────────────────────────────────────────────

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Sales</CardTitle>
            <CardDescription>
              {metadata.totalCount} total records
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <ExportListPdfButton data={data} type="sales" />
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by ref no or customer"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className="bg-primary text-primary-foreground">
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
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No sales found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="bg-muted/50 border-t text-sm font-medium">
                <TableRow>
                  <TableCell colSpan={6} />
                  <TableCell className="border-r text-center font-semibold">Totals</TableCell>
                  <TableCell className="border-r text-center">{formatCurrency(totals.paidAmount)}</TableCell>
                  <TableCell className="border-r text-center">{formatCurrency(totals.dueAmount)}</TableCell>
                  <TableCell colSpan={2}>{formatCurrency(totals.grandTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Pagination */}
          {metadata.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-muted-foreground">
                Page {metadata.currentPage} of {metadata.totalPages} •{" "}
                {metadata.totalCount} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(metadata.currentPage - 1)}
                  disabled={!metadata.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(metadata.currentPage + 1)}
                  disabled={!metadata.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}