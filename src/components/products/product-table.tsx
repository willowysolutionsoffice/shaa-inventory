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
import { Button } from "@/components/ui/button";
import { ProductTableProps as ProductTablePropsType } from "@/types/product";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginatedProductTableProps<TData>
  extends ProductTablePropsType<TData> {
  metadata: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: { stock: number };
  brands: { name: string; id: string }[];
  branches: { name: string; id: string }[];
  categories: { name: string; id: string }[];
}

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

export function ProductTable<TValue>({
  columns,
  data,
  metadata,
  totals,
  brands,
  branches,
  categories,
}: PaginatedProductTableProps<TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const currentPage = Math.max(1, metadata.currentPage || 1);
  const totalPages = Math.max(1, metadata.totalPages || 1);
  const pageSize = Math.max(1, Number(searchParams.get("limit") ?? 10));

  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const updatePagination = (page: number, limit = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    const safePage = Math.min(Math.max(page, 1), totalPages);

    params.set("page", String(safePage));
    params.set("limit", String(limit));

    router.push(`${pathname}?${params.toString()}`);
  };

  const changePageSize = (value: string) => {
    const nextLimit = Number(value);
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");
    params.set("limit", String(nextLimit));

    router.push(`${pathname}?${params.toString()}`);
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = String(row.getValue("product_name") ?? "").toLowerCase();
      const sku = String(row.getValue("sku") ?? "").toLowerCase();
      const filter = String(filterValue ?? "").toLowerCase();

      return name.includes(filter) || sku.includes(filter);
    },
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, globalFilter, columnFilters },
    pageCount: metadata.totalPages,
    meta: { brands, branches },
  });

  const firstVisibleItem =
    metadata.totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(
    currentPage * pageSize,
    metadata.totalCount,
  );

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>A list of all products</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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

            <div className="relative w-full sm:w-[220px]">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or Model No..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
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
                <TableCell colSpan={Math.max(columns.length - 2, 1)} />
              </TableRow>
            </TableFooter>
          </Table>

          <div className="flex flex-col gap-4 border-t px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-sm">
              Showing {firstVisibleItem}–{lastVisibleItem} of{" "}
              {metadata.totalCount} products
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap text-sm">
                  Rows per page
                </span>
                <Select value={String(pageSize)} onValueChange={changePageSize}>
                  <SelectTrigger className="h-9 w-[76px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => updatePagination(1)}
                  disabled={!metadata.hasPrevPage}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => updatePagination(currentPage - 1)}
                  disabled={!metadata.hasPrevPage}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="hidden items-center gap-1 sm:flex">
                  {paginationItems.map((item) => {
                    if (typeof item !== "number") {
                      return (
                        <span
                          key={item}
                          className="text-muted-foreground flex h-9 w-9 items-center justify-center text-sm"
                        >
                          …
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={item === currentPage ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updatePagination(item)}
                        aria-current={item === currentPage ? "page" : undefined}
                      >
                        {item}
                      </Button>
                    );
                  })}
                </div>

                <span className="text-muted-foreground px-2 text-sm sm:hidden">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => updatePagination(currentPage + 1)}
                  disabled={!metadata.hasNextPage}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => updatePagination(totalPages)}
                  disabled={!metadata.hasNextPage}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
