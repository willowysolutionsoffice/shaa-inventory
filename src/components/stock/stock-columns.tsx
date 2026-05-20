"use client";

import { Product } from "@/types/product";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductStockUpdateCell } from "./product-stock-update-cell";

export const stockColumns: ColumnDef<Product>[] = [
    {
        accessorKey: "sku",
        header: () => <div className="px-3 text-left">SKU</div>,
        cell: ({ row }) => (
            <div className="px-3 text-left text-muted-foreground">{row.getValue("sku")}</div>
        ),
    },
    {
        accessorKey: "product_name",
        header: ({ column }) => {
            const sort = column.getIsSorted();
            const renderIcon = () => {
                if (!sort) return <ArrowUpDown className="size-4" />;
                if (sort === "asc") return <ArrowUp className="size-4" />;
                if (sort === "desc") return <ArrowDown className="size-4" />;
                return null;
            };

            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(sort === "asc")}
                >
                    Name
                    {renderIcon()}
                </Button>
            );
        },
        cell: ({ row }) => (
            <div className="px-3 font-medium">
                {row.getValue("product_name") as string}
            </div>
        ),
    },
    {
        accessorKey: "brand",
        header: "Brand",
        cell: ({ row }) => {
            const Brand = row.original.brand.name;
            return (
                <span className="inline-flex py-0.5 text-sm text-muted-foreground">
                    {Brand}
                </span>
            );
        },
    },
    {
        accessorKey: "stock",
        header: () => <div className="px-3 text-center">Current Stock</div>,
        cell: ({ row }) => (
            <div className="px-3 text-center text-muted-foreground">
                {row.original.stock} {row.original.unit}
            </div>
        ),
    },
    {
        id: "update_stock",
        header: "New Stock",
        cell: ({ row }) => (
            <div className="flex items-center">
                <ProductStockUpdateCell product={row.original} />
            </div>
        ),
    },
];
