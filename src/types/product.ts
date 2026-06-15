import { ColumnDef } from "@tanstack/react-table";

export interface Product {
  id:            string;
  product_name:  string;
  productName:   string;
  sku:           string;
  hsl:           string | null;
  brandId:       string;
  subBrandId:    string | null;
  categoryId:    string | null;
  branchId:      string;
  stock:         number;
  purchasePrice: number;
  sellingPrice:  number;
  unit:          string;
  description:   string | null;
  brand:         { id: string; name: string };
  subBrand:      { id: string; name: string } | null;
  category:      { id: string; name: string } | null;
  branch:        { id: string; name: string };
  variations:    {
    variation: {
      id:     string;
      name:   string;
      values: { id: string; value: string }[];
    };
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTableProps<TValue> {
  columns: ColumnDef<Product, TValue>[];
  data:    Product[];
}

export interface ProductOption {
  id:            string;
  product_name:  string;
  purchasePrice: number;
  sellingPrice:  number;
  stock:         number;
  quantity:      number;
}