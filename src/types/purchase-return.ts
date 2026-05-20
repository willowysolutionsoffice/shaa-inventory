import {
  PurchaseReturn as PrismaPurchaseReturn,
  PurchaseReturnItem as PrismaPurchaseReturnItem
} from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface PurchaseReturnItem extends PrismaPurchaseReturnItem {
  product?: {
    product_name: string;
  };
}

export interface PurchaseReturn extends PrismaPurchaseReturn {
  supplier: { name: string };
  purchaseReturnItem: PurchaseReturnItem[];
}

export interface PurchaseReturnTableProps<TValue> {
  columns: ColumnDef<PurchaseReturn, TValue>[];
  data: PurchaseReturn[];
  metadata: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    totalAmount: number;
  };
}

export interface PurchaseReturnFormProps {
  purchaseReturn?: PurchaseReturn;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export type RawPurchaseReturnItem = {
  productId: string;
  product_name?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
};



export type PurchaseReturnItemField =
  | "quantity"
  | "unitPrice"
  | "subtotal"
  | "total";