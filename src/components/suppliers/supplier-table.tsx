"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, SortingState, getSortedRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SupplierRow } from "@/types/supplier";

interface SupplierTableProps<TValue> {
  columns:  ColumnDef<SupplierRow, TValue>[];
  data:     SupplierRow[];
  totals:   { openingBalance: number; purchaseDue: number; purchaseReturnDue: number };
  branches: { name: string; id: string }[];
}

export function SupplierTable<TValue>({ columns, data, totals, branches }: SupplierTableProps<TValue>) {
  const [sorting,      setSorting]      = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data, columns,
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:      getCoreRowModel(),
    getFilteredRowModel:  getFilteredRowModel(),
    getSortedRowModel:    getSortedRowModel(),
    globalFilterFn: (row, _col, filterValue) => {
      const name = (row.getValue("name") as string) ?? "";
      return name.toLowerCase().includes(String(filterValue).toLowerCase());
    },
    state: { sorting, globalFilter },
    meta:  { branches },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>A list of all suppliers</CardDescription>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input placeholder="Search suppliers..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="bg-primary text-primary-foreground">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="bg-muted/50 border-t text-sm font-medium">
              <TableRow>
                <TableCell colSpan={2} />
                <TableCell colSpan={3} className="border-r-2 text-right">Total:</TableCell>
                <TableCell className="border-r-2 text-center">{formatCurrency(totals?.openingBalance ?? 0)}</TableCell>
                <TableCell className="border-r-2 text-center">{formatCurrency(totals?.purchaseDue ?? 0)}</TableCell>
                <TableCell className="border-r-2 text-center">{formatCurrency(totals?.purchaseReturnDue ?? 0)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}