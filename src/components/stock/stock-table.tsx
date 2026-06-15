"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductTableProps } from "@/types/product";
import { useState } from "react";
import { Search } from "lucide-react";

export function StockTable<TValue>({
  columns,
  data,
}: ProductTableProps<TValue>) {
  const [sorting,       setSorting]       = useState<SortingState>([]);
  const [globalFilter,  setGlobalFilter]  = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange:      setSorting,
    getCoreRowModel:      getCoreRowModel(),
    getFilteredRowModel:  getFilteredRowModel(),
    getSortedRowModel:    getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name   = String(row.getValue("product_name") ?? "").toLowerCase();
      const sku    = String(row.getValue("sku")          ?? "").toLowerCase();
      const filter = String(filterValue ?? "").toLowerCase();
      return name.includes(filter) || sku.includes(filter);
    },
    state: { sorting, globalFilter, columnFilters },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Product Stock</CardTitle>
            <CardDescription>
              Adjust stock levels. Products with variants show per-variant controls.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-1/2 md:w-1/4">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or SKU..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}