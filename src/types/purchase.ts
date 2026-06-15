// src/types/purchase.ts
import { ColumnDef } from '@tanstack/react-table';

// ── Low-level shapes matching the Prisma DB columns ───────────────────────────

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER' | 'OTHER';

export interface PurchasePayment {
  id:            string;
  purchaseId:    string;
  amount:        number;
  paidOn:        Date | string;
  paymentMethod: PaymentMethod;
  paymentNote:   string | null;
  dueDate:       Date | string | null;
}

export interface PurchaseProduct {
  id:          string;
  productName: string;
  sku:         string;
  unit:        string;
}

export interface PurchaseItem {
  id:        string;
  purchaseId: string;
  productId:  string;
  quantity:   number;
  unitPrice:  number;
  total:      number;
  discount?:  number;
  subtotal?:  number;
  /** Populated by the API join */
  product?: PurchaseProduct & { product_name?: string };
}

export interface PurchaseSupplier {
  id:     string;
  name:   string;
  phone?: string | null;
  email?: string | null;
}

export interface PurchaseBranch {
  id:   string;
  name: string;
}

// ── Main Purchase interface ────────────────────────────────────────────────────
// Matches Prisma columns + aliases added by normalizePurchase() in the action.

export interface Purchase {
  // Prisma columns
  id:            string;
  purchaseNo:    string;
  purchaseDate:  Date | string;
  supplierId:    string;
  branchId:      string;
  totalAmount:   number;
  paymentStatus: PaymentStatus;
  paymentDue:    number;
  createdAt:     Date | string;
  updatedAt:     Date | string;

  // Relations
  supplier:  PurchaseSupplier;
  branch?:   PurchaseBranch | null;
  items:     PurchaseItem[];
  payments:  PurchasePayment[];

  // Aliases set by normalizePurchase() — keep so existing components don't break
  referenceNo?: string;   // = purchaseNo
  status?:      string;   // = paymentStatus (as string)
  dueAmount?:   number;   // = paymentDue
  paidAmount?:  number;   // = totalAmount - paymentDue
}

// ── Table / form props ─────────────────────────────────────────────────────────

export interface PurchaseTableProps<TValue> {
  columns: ColumnDef<Purchase, TValue>[];
  data:    Purchase[];
}

export interface PurchaseFormProps {
  purchase?:   Purchase;
  open?:       boolean;
  openChange?: (open: boolean) => void;
}

// ── Field key helpers ──────────────────────────────────────────────────────────

export type PurchaseItemField =
  | 'quantity'
  | 'unitPrice'
  | 'discount'
  | 'subtotal'
  | 'total';

export type PaymentField =
  | 'amount'
  | 'paidOn'
  | 'paymentMethod'
  | 'paymentNote';

// ── Raw form types ─────────────────────────────────────────────────────────────

export type RawPurchaseItem = {
  productId:    string;
  product_name?: string;
  quantity:     number;
  unitPrice:    number;
  discount:     number;
  subtotal:     number;
  total:        number;
  stock?:       number;
};

export interface RawPurchasePayment {
  amount:        number;
  paidOn:        Date;
  paymentMethod: string;
  paymentNote?:  string | null;
  dueDate?:      Date | null;
}