"use client";

// src/components/customers/customer-table.tsx

import {
  ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, SortingState, useReactTable,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { Customer } from "@/types/customer";

interface CustomerTableProps<TValue> {
  columns:  ColumnDef<Customer, TValue>[];
  data:     Customer[];
  branches: { name: string; id: string }[];
}

export function CustomerTable<TValue>({ columns, data, branches }: CustomerTableProps<TValue>) {
  const [sorting,      setSorting]      = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state:              { sorting, globalFilter },
    onSortingChange:    setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:    getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel:  getSortedRowModel(),
    globalFilterFn: (row, _colId, filterValue) => {
      const name  = String(row.getValue("name")  ?? "").toLowerCase();
      const email = String((row.original as any).email ?? "").toLowerCase();
      const phone = String((row.original as any).phone ?? "").toLowerCase();
      const q     = String(filterValue ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    },
    meta: { branches },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>{data.length} customer{data.length !== 1 ? "s" : ""}</CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email or phone…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
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
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}