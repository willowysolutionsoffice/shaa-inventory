// src/components/sales/pos-types.ts

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  purchasePrice: number;
  stock: number;
  category: string;
  brand: string;
  brandId: string;
  subBrand: string;
  subBrandId: string;
}

export interface POSCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface POSSalesman {
  id: string;
  name: string;
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
  discountPercent: number;
  discountAmount: number;
}

export interface PaymentEntry {
  method: "cash" | "card" | "upi" | "";
  amount: number | "";
}

export interface HeldBill {
  id: string;
  cart: CartItem[];
  customerId: string;
  subtotal: number;
  couponCode: string;
  couponDiscountPercent: number;
  manualDiscountPercent: number | "";
  manualDiscountAmount: number | "";
  payments: PaymentEntry[];
  splitMode: boolean;
  invoiceDate: string;
}

export interface PrintReceiptParams {
  invoiceNo: string;
  date: Date;
  customerName: string;
  customerPhone: string;
  salesmanName?: string;
  items: {
    name: string;
    sku: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  itemDiscount: number;
  couponDiscount: number;
  couponCode: string;
  manualDiscount: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
  change: number;
}

export interface LastInvoiceSnapshot extends PrintReceiptParams {
  subtotal: number;
  totalDiscount: number;
}

export const WALK_IN_SENTINEL = "__walk_in__";
export const NO_SALESMAN_SENTINEL = "__no_salesman__";

export const DEFAULT_SINGLE_PAYMENT: PaymentEntry[] = [{ method: "cash", amount: "" }];
export const DEFAULT_SPLIT_PAYMENTS: PaymentEntry[] = [
  { method: "upi", amount: "" },
  { method: "cash", amount: "" },
  { method: "card", amount: "" },
];

export const USE_KEYBOARD_GRID = true;

// ── Math & Format Helpers ─────────────────────────────────────────────────────

export const toNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

export const clampPercent = (v: number): number => Math.min(Math.max(v, 0), 100);

export function itemLineSubtotal(item: CartItem): number {
  return item.product.price * item.quantity;
}

export function itemDiscountAmount(item: CartItem): number {
  const percentDisc = (itemLineSubtotal(item) * clampPercent(item.discountPercent || 0)) / 100;
  const amountDisc = item.discountAmount || 0;
  return percentDisc + amountDisc;
}

export function itemLineTotal(item: CartItem): number {
  return itemLineSubtotal(item) - itemDiscountAmount(item);
}

export function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateInputToLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const now = new Date();
  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
}

export const fmtDate = (date: Date): { date: string; time: string } => {
  const dateStr = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return { date: dateStr, time: timeStr };
};

export function methodLabel(method: string): string {
  const m = method.toLowerCase();
  if (m === "cash") return "Cash";
  if (m === "card") return "Card";
  if (m === "upi") return "UPI";
  return method;
}
