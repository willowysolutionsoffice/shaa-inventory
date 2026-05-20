"use client";

import { Product } from "@/types/product";
import { ProductFormSheet } from "./product-form";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDeleteDialog } from "./products-delete-dailog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "sku",
    header: () => <div className="px-3 text-left">SKU</div>,
    cell: ({ row }) => (
      <div className="px-3 text-left">{row.getValue("sku")}</div>
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
      <div className="px-3">
        {row.getValue("product_name") as string}
        <span className="text-muted-foreground ml-2 text-sm">
          ({row.original.stock} {row.original.unit})
        </span>
      </div>
    ),
  },
  {
    accessorKey: "purchasePrice",
    header: () => <div className="px-3 text-center">Purchase Price</div>,
    cell: ({ row }) => {
      const amount = row.getValue("purchasePrice") as number;
      return (
        <div className="px-3 text-center font-medium">
          {formatCurrency(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => {
      const Brand = row.original.brand.name;

      return (
        <span
          className={`items-left inline-flex py-0.5 text-sm font-medium text-blue-500`}
        >
          {Brand}
        </span>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="px-3 text-center">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <div className="flex justify-center px-3">
          <ProductActions
            product={row.original}
            brands={meta?.brands || []}
            branches={meta?.branches || []}
          />
        </div>
      );
    },
  },
];

interface ProductActionsProps {
  product: Product;
  brands: { name: string; id: string }[];

  branches: { name: string; id: string }[];
}

export const ProductActions = ({ product, brands, branches }: ProductActionsProps) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/products/${product.id}`)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenDelete(true)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Sheet opens on Edit */}
      <ProductFormSheet
        product={product}
        open={openEdit}
        openChange={setOpenEdit}
        brands={brands}
        branches={branches}
      />

      {/* Dialog opens on Delete */}
      <ProductDeleteDialog
        product={product}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};
