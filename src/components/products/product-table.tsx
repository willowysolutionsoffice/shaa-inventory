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
import { ProductTableProps as ProductTablePropsType } from "@/types/product";
import { useState } from "react";
import { Search } from "lucide-react";

import { PaginationControls } from "../ui/pagination-controls";
import { TableFooter } from "@/components/ui/table";

interface PaginatedProductTableProps<TData>
  extends ProductTablePropsType<TData> {
  metadata: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    stock: number;
  };
  brands: { name: string; id: string }[];

  branches: { name: string; id: string }[];
}

export function ProductTable<TValue>({
  columns,
  data,
  metadata,
  totals,
  brands,

  branches,
}: PaginatedProductTableProps<TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const name = row.getValue("product_name") as string;
      const filter = String(filterValue || "").toLowerCase();
      return name.toLowerCase().includes(filter);
    },
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    pageCount: metadata.totalPages,
    meta: {
      brands,

      branches,
    },
  });

  return (
    <div className="flex flex-col gap-5">
      {/* <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter product by name</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card> */}
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Product</CardTitle>
            <CardDescription>A list of all Product</CardDescription>
          </div>

          <div className="relative w-full sm:w-1/2 md:w-1/4">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by Ref no or supplier"
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
                <TableCell className="border-r-2 text-center">
                  Total Stock:
                </TableCell>

                <TableCell className="text-left">
                  {totals?.stock ?? 0}
                </TableCell>

                <TableCell colSpan={8} />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        {/* <PaginationControls
          totalPages={metadata.totalPages}
          hasNextPage={metadata.hasNextPage}
          hasPrevPage={metadata.hasPrevPage}
          totalCount={metadata.totalCount}
        /> */}
      </Card>
    </div>
  );
}
