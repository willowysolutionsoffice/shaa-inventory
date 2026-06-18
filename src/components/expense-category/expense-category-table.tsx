"use client";

import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, SortingState, useReactTable, ColumnDef,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { ExpenseCategory } from "@/types/expense";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface ExpenseCategoryTableProps<TValue> {
  columns:  ColumnDef<ExpenseCategory, TValue>[];
  data:     ExpenseCategory[];
  metadata: {
    totalPages:  number;
    totalCount:  number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function ExpenseCategoryTable<TValue>({ columns, data, metadata }: ExpenseCategoryTableProps<TValue>) {
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
      const name = String(row.getValue("name") ?? "").toLowerCase();
      return name.includes(String(filterValue ?? "").toLowerCase());
    },
    state: { sorting, globalFilter },
    manualPagination: true,
    pageCount: metadata.totalPages,
  });

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>A list of all expense categories</CardDescription>
        </div>
        <div className="relative w-full sm:w-1/2 md:w-1/4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search by name" value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
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
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
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