import { ColumnDef } from "@tanstack/react-table";

export interface Product {
  id: string;
  product_name: string;
  sku: string;
  brandId: string;
  branchId: string;
  stock: number;
  purchasePrice: number;
  sellingPrice?: number;
  unit: string;
  description?: string;
  brand: { name: string };
  createdAt?: Date;
  updatedAt?: Date;
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