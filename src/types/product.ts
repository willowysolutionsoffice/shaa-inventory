import { Product as PrismaProduct } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export interface Product extends PrismaProduct {
  brand: { name: string };
}

export interface ProductTableProps<TValue> {
  columns: ColumnDef<Product, TValue>[];
  data: Product[];
}

export interface ProductOption {
  id: string;
  product_name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;

  quantity: number;
}