"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type ColumnFiltersState,
  type ColumnDef,
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
import { Search } from "lucide-react";
import { useState } from "react";
import { SalesReturn } from "@/types/sales-return";
import { formatCurrency } from "@/lib/utils";


interface SalesReturnTableProps<TValue> {
  columns: ColumnDef<SalesReturn, TValue>[];
  data: SalesReturn[];
  metadata: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    grandTotal: number;
  };
}

export function SalesReturnTable<TValue>({
  columns,
  data,
  metadata,
  totals,
}: SalesReturnTableProps<TValue>) {
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
  const ref      = String(row.getValue("returnNo")          ?? "").toLowerCase();
  const invoice  = String(row.original.sale?.invoiceNo      ?? "").toLowerCase();
  const customer = String(row.original.customer?.name       ?? "").toLowerCase();
  const q        = String(filterValue ?? "").toLowerCase();
  return ref.includes(q) || invoice.includes(q) || customer.includes(q);
},
    manualPagination: true,
    pageCount: metadata.totalPages,
  });

  // const totalReturnedAmount = data.reduce((acc, row) => acc + (row?.grandTotal ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Search Filter */}
      {/* <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search returns by reference number or supplier</CardDescription>
          </div>

          
        </CardHeader>
      </Card> */}

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Sales Returns</CardTitle>
            <CardDescription>A list of all sales returns</CardDescription>
          </div>
          <div className="relative mt-3 w-full sm:w-1/2 md:w-1/4">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by Invoice no or customer"
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
                <TableCell colSpan={3} className="border-r-2 text-right">
                  Total Returned:
                </TableCell>

                <TableCell className="border-r-2 text-center font-semibold">
                  {formatCurrency(totals?.grandTotal || 0)}
                </TableCell>

                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>

      </Card>
    </div>
  );
}
