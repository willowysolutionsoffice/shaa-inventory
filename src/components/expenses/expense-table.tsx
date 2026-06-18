"use client";

import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, SortingState, useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { ExpenseTableProps } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { PaginationControls } from "@/components/ui/pagination-controls";

export function ExpenseTable<TValue>({ columns, data, metadata, totals }: ExpenseTableProps<TValue>) {
  const [sorting,      setSorting]      = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:      getCoreRowModel(),
    getFilteredRowModel:  getFilteredRowModel(),
    getSortedRowModel:    getSortedRowModel(),
    globalFilterFn: (row, _colId, filterValue) => {
      const title    = String(row.getValue("title")       ?? "").toLowerCase();
      const desc     = String(row.getValue("description") ?? "").toLowerCase();
      const category = String(row.original.category?.name ?? "").toLowerCase();
      const q        = String(filterValue ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q) || category.includes(q);
    },
    state: { sorting, globalFilter },
    manualPagination: true,
    pageCount: metadata.totalPages,
  });

  const pageTotal = data.reduce((acc, row) => acc + (row?.amount ?? 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>A list of all expenses</CardDescription>
        </div>
        <div className="relative w-full sm:w-1/2 md:w-1/4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input placeholder="Search by title, description, category"
            value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="bg-primary text-primary-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="bg-muted/50 border-t text-sm font-medium">
            <TableRow>
              <TableCell colSpan={3} />
              <TableCell className="border-r text-center">Page Total:</TableCell>
              <TableCell className="border-r text-center">{formatCurrency(pageTotal)}</TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} />
              <TableCell className="border-r text-center">Grand Total:</TableCell>
              <TableCell className="border-r text-center">{formatCurrency(totals?.amount ?? 0)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>

      <PaginationControls
        totalPages={metadata.totalPages}
        hasNextPage={metadata.hasNextPage}
        hasPrevPage={metadata.hasPrevPage}
        totalCount={metadata.totalCount}
      />
    </Card>
  );
}