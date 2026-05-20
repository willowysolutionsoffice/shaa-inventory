"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
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
import { useState } from "react";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { ExpenseTableProps, Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";

import { PaginationControls } from "../ui/pagination-controls";

export function ExpenseTable<TValue>({
  columns,
  data,
  metadata,
  totals,
}: ExpenseTableProps<TValue>) {
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
      const title = row.getValue("title") as string;
      const description = row.getValue("description") as string;
      const category = row.getValue("category") as string;

      const filter = String(filterValue || "").toLowerCase();

      return (
        title.toLowerCase().includes(filter) ||
        description.toLocaleLowerCase().includes(filter) ||
        category.toLocaleLowerCase().includes(filter)
      );
    },
    state: {
      sorting,
      globalFilter,
    },
    manualPagination: true,
    pageCount: metadata.totalPages,
  });

  // const totalExpenseAmount = data.reduce((acc, row) => acc + (row?.amount ?? 0), 0);
  const totalExpenseAmount = data.reduce(
    (acc, row) => acc + (row?.amount ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* <Card>
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter expense by name</CardDescription>
        </div>
      </CardHeader>
    </Card> */}

      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>A list of all Expenses</CardDescription>
          </div>
          <div className="relative w-full sm:w-1/2 md:w-1/4">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by title,description,category"
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
                  {headerGroup.headers.map((header) => {
                    return (
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
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                <TableCell colSpan={3} />
                <TableCell className="border-r-2 text-center">
                  Page Total:
                </TableCell>
                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totalExpenseAmount)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell className="border-r-2 text-center">
                  Grand Total:
                </TableCell>
                <TableCell className="border-r-2 text-center">
                  {formatCurrency(totals?.amount ?? 0)}
                </TableCell>
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
    </div>
  );
}
