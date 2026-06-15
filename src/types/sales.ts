// src/types/sales.ts
import {
  Branch,
  Sale as PrismaSale,
  SaleItem as PrismaSaleItem,
  SalesPayment,
  PaymentStatus,
} from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

// ── Product shape returned by the API ─────────────────────────────────────────

export interface SaleItemProduct {
  id:           string;
  productName:  string;
  product_name: string; // alias for compatibility
  sku:          string;
  stock:        number;
}

// ── SaleItem with nested product ──────────────────────────────────────────────

export interface SaleItem extends Omit<PrismaSaleItem, "unitPrice" | "discount" | "subtotal" | "total" | "purchasePrice"> {
  unitPrice:     number;
  discount:      number;
  subtotal:      number;
  total:         number;
  purchasePrice: number;
  product?:      SaleItemProduct;
}

// ── Customer shape (subset of Prisma Customer) ────────────────────────────────

export interface SaleCustomer {
  id:             string;
  name:           string;
  email?:         string | null;
  phone?:         string | null;
  openingBalance: number;
}

// ── Sale with all relations ───────────────────────────────────────────────────

export interface Sale extends Omit<PrismaSale, "grandTotal" | "paymentDue"> {
  // Prisma Decimal → number for convenience
  grandTotal:    number;
  paymentDue:    number;
  // Computed fields added by the API list/get endpoints
  dueAmount?:    number; // alias for paymentDue
  paidAmount?:   number;
  // salesdate alias (frontend uses lowercase; Prisma model uses salesDate)
  salesdate:     Date;
  // Relations
  customer:      SaleCustomer;
  items:         SaleItem[];
  payments:      SalePayment[];
  branch?:       Branch | null;
}

// ── Payment (renamed from SalesPayment to avoid Prisma name clash) ────────────

export interface SalePayment extends Omit<SalesPayment, "amount"> {
  amount:        number;
  paymentMethod: string; // keep as string; Prisma enum is PaymentMethod
}

// ── Form / table prop types ───────────────────────────────────────────────────

export interface SaleFormProps {
  sales?:      Sale;
  open?:       boolean;
  openChange?: (open: boolean) => void;
}

export interface SaleTableProps<TValue> {
  columns: ColumnDef<Sale, TValue>[];
  data:    Sale[];
}

// ── Misc helper types ─────────────────────────────────────────────────────────

export type SaleItemField = "quantity" | "unitPrice" | "discount";

export interface SaleCount {
  grandTotal?:    number;
  paymentDue?:    number;
  paymentStatus?: string;
}

export type RawSaleItem = {
  productId:      string;
  product_name?:  string;
  quantity:       number;
  unitPrice:      number;
  discount:       number;
  subtotal:       number;
  total:          number;
  purchasePrice?: number;
  sellingPrice?:  number;
};

export interface RawSalesPayment {
  amount:         number;
  paidOn:         Date;
  paymentMethod:  string;
  paymentNote?:   string | null;
  dueDate?:       Date | null;
}