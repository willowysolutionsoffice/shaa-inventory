"use client";

import { Product } from "@/types/product";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductStockUpdateCell } from "./product-stock-update-cell";

export const stockColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "sku",
    header: () => <div className="px-3 text-left">SKU</div>,
    cell: ({ row }) => (
      <div className="px-3 text-left font-mono text-sm text-muted-foreground">
        {row.getValue("sku")}
      </div>
    ),
  },
  {
    accessorKey: "product_name",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Name
          {!sort
            ? <ArrowUpDown className="size-4" />
            : sort === "asc"
            ? <ArrowUp className="size-4" />
            : <ArrowDown className="size-4" />}
        </Button>
      );
    },
    cell: ({ row }) => {
      const hasVariants = (row.original.variations?.length ?? 0) > 0;
      return (
        <div className="px-3">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{row.getValue("product_name") as string}</span>
            {hasVariants && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded font-medium">
                <Layers className="h-2.5 w-2.5" />
                Variants
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.brand?.name ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "stock",
    header: () => <div className="px-3 text-center">Current Stock</div>,
    cell: ({ row }) => {
      const hasVariants = (row.original.variations?.length ?? 0) > 0;
      return (
        <div className="px-3 text-center">
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.stock} {row.original.unit}
          </Badge>
          {hasVariants && (
            <p className="text-[10px] text-muted-foreground mt-0.5">total</p>
          )}
        </div>
      );
    },
  },
  {
    id: "update_stock",
    header: () => <div className="px-3">Adjust Stock</div>,
    cell: ({ row }) => (
      <div className="px-1">
        <ProductStockUpdateCell product={row.original} />
      </div>
    ),
  },
];