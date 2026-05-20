import {
  SalesReturnItem as PrismaSalesReturnItem
  , SalesReturn as PrismaSalesReturn
} from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export interface SalesReturnItem extends PrismaSalesReturnItem {
  product?: {
    product_name: string;
  };
}

export interface SalesReturn extends PrismaSalesReturn {
  customer: { name: string };
  salesReturnItem: SalesReturnItem[];
}

export interface SalesReturnFormProps {
  salesReturn?: SalesReturn;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface SalesReturnTableProps<TValue> {
  columns: ColumnDef<SalesReturn, TValue>[];
  data: SalesReturn[];
}

export type RawSalesReturnItem = {
  productId: string;
  product_name?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
};

export type SalesReturnItemField =
  | "quantity"
  | "unitPrice"
  | "subtotal"
  | "total";