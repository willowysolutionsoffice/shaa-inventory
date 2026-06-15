// src/types/purchase-return.ts
import { ColumnDef } from '@tanstack/react-table';

// ── Low-level shapes ───────────────────────────────────────────────────────────

export interface PurchaseReturnProduct {
  id:          string;
  productName: string;
  sku:         string;
  unit:        string;
}

export interface PurchaseReturnItem {
  id:               string;
  purchaseReturnId: string;
  productId:        string;
  quantity:         number;
  unitPrice:        number;
  total:            number;
  subtotal?:        number;
  /** Populated by the API join */
  product?: PurchaseReturnProduct & { product_name?: string };
}

export interface PurchaseReturnSupplier {
  id:   string;
  name: string;
}

// ── Main PurchaseReturn interface ──────────────────────────────────────────────
// Matches Prisma columns + aliases added by normalizePurchaseReturn().

export interface PurchaseReturn {
  // Prisma columns
  id:          string;
  returnNo:    string;
  returnDate:  Date | string;
  purchaseId:  string;
  supplierId:  string;
  branchId:    string;
  totalAmount: number;
  createdAt:   Date | string;
  updatedAt:   Date | string;

  // Relations
  supplier: PurchaseReturnSupplier;

  // `items` is the DB relation name; `purchaseReturnItem` is the form field name.
  // normalizePurchaseReturn() populates both so nothing breaks.
  items:              PurchaseReturnItem[];
  purchaseReturnItem: PurchaseReturnItem[];

  // Optional alias
  referenceNo?: string;
}

// ── Table / form props ─────────────────────────────────────────────────────────

export interface PurchaseReturnTableProps<TValue> {
  columns:  ColumnDef<PurchaseReturn, TValue>[];
  data:     PurchaseReturn[];
  metadata: {
    totalPages:  number;
    totalCount:  number;
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
  open?:           boolean;
  openChange?:     (open: boolean) => void;
}

// ── Field key helpers ──────────────────────────────────────────────────────────

export type PurchaseReturnItemField =
  | 'quantity'
  | 'unitPrice'
  | 'subtotal'
  | 'total';

// ── Raw form types ─────────────────────────────────────────────────────────────

export type RawPurchaseReturnItem = {
  productId:    string;
  product_name?: string;
  quantity:     number;
  unitPrice:    number;
  subtotal:     number;
  total:        number;
};