import { Branch, Sale as PrismaSale, SaleItem as PrismaSaleItem, SalesPayment } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export interface SaleItem extends PrismaSaleItem {
  product?: {
    product_name: string;
    stock: number;
    salePrice?: number;
  };
}

export interface Sale extends PrismaSale {
  customer: { name: string, openingBalance: number };
  items: SaleItem[];
  payments: SalesPayment[];
  branch?: Branch | null;
}

export interface SaleFormProps {
  sales?: Sale;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface SaleTableProps<TValue> {
  columns: ColumnDef<Sale, TValue>[];
  data: Sale[];
}

export type SaleItemField =
  | "quantity"
  | "unitPrice"
  | "discount"

export interface SaleCount {
  grandTotal?: number;
  paymentDue?: number;
  paymentStatus?: string;
}

export type RawSaleItem = {
  productId: string;
  product_name?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
  purchasePrice?: number;
  sellingPrice?: number;
};

export interface RawSalesPayment {
  amount: number;
  paidOn: Date;
  paymentMethod: string;
  paymentNote?: string | null;
  dueDate?: Date | null;
}
