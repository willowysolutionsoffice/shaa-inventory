"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
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
import { Customer } from "@prisma/client";
import { useState } from "react";
import { Search } from "lucide-react";


import { TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface CustomerTableProps<TValue> {
  columns: ColumnDef<Customer, TValue>[];
  data: Customer[];

  totals: {
    openingBalance: number;
    outstandingPayments: number;
    salesDue: number;
    salesReturnDue: number;
  };
  branches: { name: string; id: string }[];
}

export function CustomerTable<TValue>({
  columns,
  data,
  totals,
  branches,
}: CustomerTableProps<TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const name = row.getValue("name") as string;
      const filter = String(filterValue || "").toLowerCase();
      return name.toLowerCase().includes(filter);
    },
    state: {
      sorting,
      globalFilter,
    },
    meta: {
      branches,
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>A list of all customers</CardDescription>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search customers..."
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
                <TableCell />

                <TableCell />

                <TableCell colSpan={3} className="border-r-2 text-right">
                  Total:
                </TableCell>

                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totals?.openingBalance ?? 0)}
                </TableCell>

                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totals?.salesDue ?? 0)}
                </TableCell>

                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totals?.salesReturnDue ?? 0)}
                </TableCell>

                {/* Actions */}
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
