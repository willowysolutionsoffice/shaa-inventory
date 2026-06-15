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
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductTableProps as ProductTablePropsType } from "@/types/product";
import { useState } from "react";
import { Search } from "lucide-react";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
interface PaginatedProductTableProps<TData> extends ProductTablePropsType<TData> {
  metadata: {
    totalPages:  number;
    totalCount:  number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals:   { stock: number };
  brands:   { name: string; id: string }[];
  branches: { name: string; id: string }[];
    categories: { name: string; id: string }[]; // ← add this

}

export function ProductTable<TValue>({
  columns, data, metadata, totals, brands, branches, categories,
}: PaginatedProductTableProps<TValue>) {
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
      const sku    = String(row.getValue("sku") ?? "").toLowerCase();
      const filter = String(filterValue ?? "").toLowerCase();
      return name.includes(filter) || sku.includes(filter);
    },
onColumnFiltersChange: setColumnFilters,
state: { sorting, globalFilter, columnFilters },
    pageCount: metadata.totalPages,
    meta: { brands, branches },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
  <div>
    <CardTitle>Products</CardTitle>
    <CardDescription>A list of all products</CardDescription>
  </div>
  <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
    {/* Category filter */}
    <Select
      onValueChange={(value) => {
        table
          .getColumn("category")
          ?.setFilterValue(value === "all" ? undefined : value);
      }}
      defaultValue="all"
    >
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Existing search input */}
    <div className="relative w-full sm:w-[200px]">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="Search by name or SKU..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="pl-9"
      />
    </div>
  </div>
</CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="bg-muted/50 border-t text-sm font-medium">
              <TableRow>
                <TableCell className="border-r-2 text-center">Total Stock:</TableCell>
                <TableCell className="text-left">{totals?.stock ?? 0}</TableCell>
                <TableCell colSpan={8} />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}