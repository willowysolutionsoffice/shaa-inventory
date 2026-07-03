// src/components/sales/pos-billing.tsx
"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import qz from "qz-tray";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  Percent,
  CreditCard,
  Wallet,
  Receipt,
  UserPlus,
  PauseCircle,
  ShoppingBag,
  Tag,
  Sparkles,
  Loader2,
  IndianRupee,
  UserCog,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getBrandListForDropdown,
  getSubBrandsByBrand,
} from "@/actions/brand-actions";
import { getUserList } from "@/actions/user-action";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { createSale } from "@/actions/sales-action";
import {
  getCustomerListForDropdown,
  createCustomer,
} from "@/actions/customer-action";
import { getProductDropdown } from "@/actions/product-actions";
import { CustomerFormDialog } from "@/components/customers/customer-form";

// ── Types ─────────────────────────────────────────────────────────────────────

interface POSProduct {
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

interface POSCustomer {
  id: string;
  name: string;
  phone: string;
}

interface CartItem {
  product: POSProduct;
  quantity: number;
  // ← added: per-line discount, entered as a percent of that line's subtotal
  discountPercent: number;
}

interface HeldBill {
  id: string;
  cart: CartItem[];
  customerId: string;
  subtotal: number;
  couponCode: string;
  couponDiscountPercent: number;
  manualDiscountPercent: number | "";
  payments: PaymentEntry[];
  splitMode: boolean;
}

// method can be "" only in split mode, for an auto-created "remaining" row
// that hasn't had its payment method chosen yet.
interface PaymentEntry {
  method: "cash" | "card" | "upi" | "";
  amount: number | "";
}
interface POSSalesman {
  id: string;
  name: string;
}

const WALK_IN_SENTINEL = "__walk_in__";
const NO_SALESMAN_SENTINEL = "__no_salesman__";

const DEFAULT_SINGLE_PAYMENT: PaymentEntry[] = [{ method: "cash", amount: "" }];
const DEFAULT_SPLIT_PAYMENTS: PaymentEntry[] = [
  { method: "upi", amount: "" },
  { method: "cash", amount: "" },
  { method: "card", amount: "" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const toNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

const clampPercent = (v: number): number => Math.min(Math.max(v, 0), 100);

// ── Per-line item discount helpers ──────────────────────────────────────────
// A cart line's discount is stored as a percent of that line's own subtotal
// (unitPrice * quantity), independent of the cart-level coupon / manual
// discount, which are applied afterward on the post-item-discount total.

function itemLineSubtotal(item: CartItem): number {
  return item.product.price * item.quantity;
}

function itemDiscountAmount(item: CartItem): number {
  return (itemLineSubtotal(item) * clampPercent(item.discountPercent || 0)) / 100;
}

function itemLineTotal(item: CartItem): number {
  return itemLineSubtotal(item) - itemDiscountAmount(item);
}

const fmtDate = (date: Date): { date: string; time: string } => {
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

function methodLabel(method: string): string {
  const m = method.toLowerCase();
  if (m === "cash") return "Cash";
  if (m === "card") return "Card";
  if (m === "upi") return "UPI";
  return method;
}

// Matches buildPaymentHtml in pos-invoice.tsx exactly — takes normalized payments
// (amounts are guaranteed numbers here since we filter before passing in)
// ── NOT MODIFIED — invoice print logic left exactly as-is ──────────────────────
function buildPaymentHtml(
  payments: { method: string; amount: number }[],
  change: number,
): string {
  const isSplit = payments.length > 1;

  const changeRow =
    change > 0
      ? `<div class="bold" style="display:flex;justify-content:space-between;margin-top:2px;font-size:11px;"><span>Change:</span><span>${change.toLocaleString("en-IN")}</span></div>`
      : "";

  if (!isSplit) {
    return `
      <div class="bold" style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
        <span>Paid via:</span>
        <span>${methodLabel(payments[0].method)}</span>
      </div>
      ${changeRow}
    `;
  }

  const rows = payments
    .map(
      (p) => `
    <div class="bold" style="display:flex;justify-content:space-between;font-size:11px;padding-left:8px;">
      <span>&#x21b3; ${methodLabel(p.method)}:</span>
      <span>${p.amount.toLocaleString("en-IN")}</span>
    </div>`,
    )
    .join("");

  return `
    <div class="bold" style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
      <span>Paid via:</span><span>Split Payment</span>
    </div>
    ${rows}
    ${changeRow}
  `;
}
// ── Thermal print function — identical HTML/CSS to pos-invoice.tsx printThermal ──
// ── Item-discount line added below (buildPaymentHtml itself is untouched) ──────

interface PrintReceiptParams {
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
  itemDiscount: number; // ← added: sum of all per-line item discounts
  couponDiscount: number;
  couponCode: string;
  manualDiscount: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
  change: number;
}

interface LastInvoiceSnapshot extends PrintReceiptParams {
  subtotal: number;
  totalDiscount: number;
}

function printThermalReceipt(params: PrintReceiptParams) {


  const { date, time } = fmtDate(params.date);

  const itemRows = params.items
    .map(
      (item, i) => `
  <tr style="border-bottom:${i < params.items.length - 1 ? "1px dashed #000" : "none"};">
    <td style="padding:4px 0;font-size:9px;">${i + 1}</td>
    <td style="padding:4px 2px 4px 0;font-size:9px;word-break:break-all;line-height:1.3;">${item.sku}</td>
    <td class="heavy" style="padding:4px 2px 4px 0;font-size:9px;word-break:break-word;line-height:1.3;">${item.name}</td>
    <td style="padding:4px 0;text-align:center;font-size:9px;">${item.qty}</td>
    <td style="padding:4px 0;text-align:right;font-size:9px;">${item.unitPrice.toLocaleString("en-IN")}</td>
    <td class="heavy" style="padding:4px 0;text-align:right;font-size:9px;">${item.total.toLocaleString("en-IN")}</td>
  </tr>`,
    )
    .join("");

  const itemDiscountRow =
    params.itemDiscount > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Item Discounts:</span><span>-${params.itemDiscount.toLocaleString("en-IN")}</span></div>`
      : "";

  const couponRow =
    params.couponDiscount > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Coupon (${params.couponCode}):</span><span>-${params.couponDiscount.toLocaleString("en-IN")}</span></div>`
      : "";

  const discountRow =
    params.manualDiscount > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Discount:</span><span>-${params.manualDiscount.toLocaleString("en-IN")}</span></div>`
      : "";

  const customerBlock =
    params.customerName && params.customerName !== "Select a Customer"
      ? `<div class="heavy" style="padding-left:8px;">${params.customerName}</div>`
      : "";

  const phoneBlock = params.customerPhone
    ? `<div style="padding-left:8px;font-size:10px;">${params.customerPhone}</div>`
    : "";

  const paymentHtml = buildPaymentHtml(params.payments, params.change);

  const html = `
    <html>
      <head>
        <title>Receipt - ${params.invoiceNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: 80mm auto; margin: 0; }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.55;
    color: #000000;
    background: #ffffff;
    width: 80mm;
    padding: 14px 12px;
  }
  div, span, p {
    font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
    font-weight: 800;
    color: #000000;
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { font-weight: 900; color: #000; font-family: 'Roboto Mono', 'Courier New', Courier, monospace; }
  td { font-weight: 800; color: #000; font-family: 'Roboto Mono', 'Courier New', Courier, monospace; }
  strong { font-weight: 900; }
  .bold  { font-weight: 900 !important; }
  .heavy { font-weight: 900 !important; }
</style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:10px;">
          <div class="heavy" style="font-size:17px;letter-spacing:1.5px;text-transform:uppercase;">SHAASHOPY</div>
          <div style="font-size:10px;margin-top:1px;">2ND FLOOR, HILITE MALL</div>
          <div style="font-size:10px;">PH: +91 9847640052</div>
          <div style="font-size:10px;">GSTIN: 32AFJFS9358F1ZN</div>
        </div>

        <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:5px 0;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span>Bill No : <strong>${params.invoiceNo}</strong></span>
            <span>Date : ${date}</span>
          </div>
          <div style="text-align:right;">Time : ${time}</div>
        </div>

        <div style="margin-bottom:6px;">
          <div>To :</div>
          ${customerBlock}
          ${phoneBlock}
        </div>

        <table style="border-top:1px dashed #000;">
<colgroup>
  <col style="width:12px"/>
  <col style="width:55px"/>
  <col/>
  <col style="width:20px"/>
  <col style="width:50px"/>
  <col style="width:50px"/>
</colgroup>

<thead>
  <tr style="border-bottom:1px dashed #000;font-size:9px;">
    <th style="text-align:left;padding:4px 0 3px;">Sn</th>
    <th style="text-align:left;padding:4px 0 3px;">Code</th>
    <th style="text-align:left;padding:4px 0 3px;">Item</th>
    <th style="text-align:center;padding:4px 0 3px;">Qty</th>
    <th style="text-align:right;padding:4px 0 3px;">Rate</th>
    <th style="text-align:right;padding:4px 0 3px;">Total</th>
  </tr>
</thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="border-top:1px dashed #000;padding-top:6px;margin-top:2px;">
          ${itemDiscountRow}
          ${couponRow}
          ${discountRow}
          <div class="heavy" style="display:flex;justify-content:space-between;font-size:14px;border-top:1px solid #000;margin-top:4px;padding-top:4px;">
            <span>Grand Total:</span>
            <span>${toNum(params.grandTotal).toLocaleString("en-IN")}</span>
          </div>
          ${paymentHtml}
        </div>

        <div style="border-top:1px dashed #000;margin-top:8px;padding-top:6px;text-align:center;font-size:10px;">
<div><span class="bold">SALESMAN :</span> &nbsp;${params.salesmanName || ""}</div>
          <div style="margin-top:2px;">Insta ID :&nbsp;<span class="bold">shaashopy.hilitemall</span></div>
        </div>

        <div style="border-top:1px solid #000;border-bottom:1px solid #000;margin-top:10px;padding:8px 0;">
          <div class="bold" style="font-size:11px;margin-bottom:6px;text-decoration:underline;text-align:center;">TERMS AND CONDITIONS</div>
          <div style="font-size:10px;margin-bottom:2px;">* No Cash Refund</div>
          <div style="font-size:10px;margin-bottom:2px;">* NO credit note will be issued</div>
          <div style="font-size:10px;margin-bottom:2px;">* NO Guarantee is provided for fancy items</div>
          <div style="font-size:10px;margin-bottom:2px;">* Exchange Within 3 Days (Only on Same Brand)</div>
          <div style="font-size:10px;margin-bottom:2px;">* Only dry wash recommend for this material</div>
          <div style="font-size:10px;margin-bottom:2px;">* We are under composition taxpayer, We are not collecting tax from customer</div>
        </div>

        <div class="bold" style="text-align:center;margin-top:10px;font-size:11px;letter-spacing:0.5px;">THANK YOU VISIT AGAIN ;</div>

        
      </body>
    </html>
`;

  printWithQZ(html);
}
console.log("Calling QZ...");
// ── Component ─────────────────────────────────────────────────────────────────
async function setupQZSecurity() {
  qz.security.setCertificatePromise(async () => {
    const res = await fetch("/qz/digital-certificate.txt");

    if (!res.ok) {
      throw new Error("QZ certificate not found");
    }

    return await res.text();
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise((toSign) => {
    return async (resolve, reject) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/qz/sign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ request: toSign }),
          }
        );

        if (!res.ok) {
          throw new Error("QZ signature failed");
        }

        const data = await res.json();
        resolve(data.signature);
      } catch (err) {
        reject(err);
      }
    };
  });
}

async function printWithQZ(invoiceHtml: string) {
  try {
    await setupQZSecurity();

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }

    const printer =
      localStorage.getItem("pos_printer_name") ||
      "Microsoft Print to PDF";

    const config = qz.configs.create(printer, {
      margins: 0,
      units: "mm",
      size: { width: 80 },
      scaleContent: false,
      rasterize: false,
    });

    await qz.print(config, [
      {
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: invoiceHtml,
      },
    ]);

    toast.success("Invoice sent to printer.");
  } catch (err) {
    console.error("[QZ print error]", err);
    toast.error("QZ printing failed.");
  }
}
export default function PosBillingPage({
  branchId = "",
  branchName = "Branch",
}: {
  branchId?: string;
  branchName?: string;
}) {
  const router = useRouter();

  // ── Remote data ────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  // Moved up: needed by callbacks declared right below
  const [salesmen, setSalesmen] = useState<POSSalesman[]>([]);
  const [selectedSalesman, setSelectedSalesman] =
    useState(NO_SALESMAN_SENTINEL);
  const [walkInCustomerId, setWalkInCustomerId] = useState<string | null>(null);

  // ── Barcode scanner auto-focus ────────────────────────────────────────────
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const focusBarcodeInput = useCallback(() => {
    // setTimeout lets any pending re-render (state updates, dialogs closing) settle first
    setTimeout(() => barcodeInputRef.current?.focus(), 0);
  }, []);

  const ensureWalkInCustomer = useCallback(
    async (existing: POSCustomer[]): Promise<string | null> => {
      const found = existing.find((c) => /walk[\s-]?in/i.test(c.name));
      if (found) return found.id;
      if (!branchId) return null;

      try {
        const res: any = await createCustomer({
          name: "Walk-in Customer",
          branchId,
        });
        if (res?.data?.error) {
          console.error("[POS] Walk-in customer create failed", res.data.error);
          return null;
        }
        const newCust = res?.data?.data ?? res?.data;
        return newCust?.id ?? null;
      } catch (err) {
        console.error("[POS] Failed to auto-create walk-in customer", err);
        return null;
      }
    },
    [branchId],
  );

  const fetchCustomers = useCallback(async () => {
    const custRes = await getCustomerListForDropdown();
    const remoteCustomers: POSCustomer[] = (custRes ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? "",
    }));

    const walkInId = await ensureWalkInCustomer(remoteCustomers);
    setWalkInCustomerId(walkInId);

    setCustomers([
      { id: WALK_IN_SENTINEL, name: "Walk-in Customer", phone: "" },
      ...remoteCustomers.filter((c) => c.id !== walkInId),
    ]);
    return remoteCustomers;
  }, [ensureWalkInCustomer]);

  const fetchSalesmen = useCallback(async () => {
    try {
      const res: any = await getUserList();
      const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      const scoped = branchId
        ? list.filter(
          (u) => u.branch?.id === branchId || u.branchId === branchId,
        )
        : list;
      setSalesmen(
        (scoped.length ? scoped : list).map((u: any) => ({
          id: u.id,
          name: u.name,
        })),
      );
    } catch (err) {
      console.error("[POS] Failed to load salesmen", err);
    }
  }, [branchId]);

  useEffect(() => {
    (async () => {
      try {
        const [, prodRes, brandRes] = await Promise.all([
          fetchCustomers(),
          getProductDropdown({ query: "" }),
          getBrandListForDropdown(),
          fetchSalesmen(),
        ]);
        setBrandOptions(brandRes ?? []);
        console.log(
          "[POS] raw product[0]:",
          JSON.stringify(prodRes?.[0], null, 2),
        );

        setProducts(
          (prodRes ?? []).map((p: any) => ({
            id: p.id,
            name: p.product_name ?? p.productName ?? "Unknown",
            sku: p.sku ?? "",
            price: Number(p.sellingPrice ?? p.purchasePrice ?? 0),
            purchasePrice: Number(p.purchasePrice ?? 0),
            stock: Number(p.stock ?? 0),
            category: p.category?.name ?? p.category ?? "General",
            brand: p.brand?.name ?? p.brandName ?? "",
            brandId: p.brand?.id ?? p.brandId ?? p.brand_id ?? "",
            subBrand: p.subBrand?.name ?? p.subBrandName ?? "",
            subBrandId: p.subBrand?.id ?? p.subBrandId ?? p.sub_brand_id ?? "",
          })),
        );
      } catch (err: any) {
        console.error("[POS load]", err);
        toast.error("Failed to load POS terminal data.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [fetchCustomers, fetchSalesmen]);

  // Auto-focus the barcode scanner once initial load completes
  useEffect(() => {
    if (!loadingData) focusBarcodeInput();
  }, [loadingData, focusBarcodeInput]);

  const handleAddCustomerClose = useCallback(
    async (open: boolean) => {
      setAddCustomerOpen(open);
      if (!open) {
        try {
          const prevIds = new Set(customers.map((c) => c.id));
          if (walkInCustomerId) prevIds.add(walkInCustomerId);

          const fresh = await fetchCustomers();
          const newEntry = fresh.find(
            (c) => !prevIds.has(c.id) && c.id !== walkInCustomerId,
          );
          if (newEntry) {
            setSelectedCustomer(newEntry.id);
            toast.success(`"${newEntry.name}" added and selected.`);
          }
        } catch { }
        focusBarcodeInput();
      }
    },
    [fetchCustomers, customers, walkInCustomerId, focusBarcodeInput],
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedSubBrand, setSelectedSubBrand] = useState("All");
  const [subBrandOptions, setSubBrandOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [brandOptions, setBrandOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(WALK_IN_SENTINEL);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<
    number | ""
  >("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentEntry[]>(
    DEFAULT_SINGLE_PAYMENT,
  );
  const [splitMode, setSplitMode] = useState(false);

  // ── Server action ──────────────────────────────────────────────────────────

  const [pendingPrint, setPendingPrint] = useState<Omit<
    PrintReceiptParams,
    "invoiceNo"
  > | null>(null);
  const [lastInvoice, setLastInvoice] = useState<LastInvoiceSnapshot | null>(
    null,
  );
  const [lastInvoiceOpen, setLastInvoiceOpen] = useState(false);

  useEffect(() => {
    if (selectedBrand === "All") {
      setSubBrandOptions([]);
      setSelectedSubBrand("All");
      return;
    }
    getSubBrandsByBrand(selectedBrand)
      .then((res) => setSubBrandOptions(res ?? []))
      .catch(() => setSubBrandOptions([]));
    setSelectedSubBrand("All");
  }, [selectedBrand]);

  const { execute: executeSale, isExecuting: isCheckingOut } = useAction(
    createSale,
    {
      onSuccess: ({ data }) => {
        if ((data as any)?.error) {
          toast.error((data as any).error);
          setPendingPrint(null);
          return;
        }

        const invoiceNo: string =
          (data as any)?.invoiceNo ??
          (data as any)?.data?.invoiceNo ??
          `INV-${Date.now().toString().slice(-6)}`;

        if (pendingPrint) {
          const snapshot: LastInvoiceSnapshot = {
            ...pendingPrint,
            invoiceNo,
            subtotal: pendingPrint.items.reduce(
              (s, item) => s + item.unitPrice * item.qty,
              0,
            ),
            totalDiscount:
              pendingPrint.itemDiscount +
              pendingPrint.couponDiscount +
              pendingPrint.manualDiscount,
          };
          setLastInvoice(snapshot);
          printThermalReceipt({ ...pendingPrint, invoiceNo });
          setPendingPrint(null);
        }

        resetCart();
        toast.success("Checkout complete! Receipt sent to printer.");
      },
      onError: (err) => {
        console.error("[POS checkout error]", err);
        toast.error("Checkout failed. Please try again.");
        setPendingPrint(null);
      },
    },
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return products.filter((p) => {
      if (p.stock <= 0) return false;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchesBrand =
        selectedBrand === "All" || p.brandId === selectedBrand;
      const matchesSubBrand =
        selectedSubBrand === "All" || p.subBrandId === selectedSubBrand;
      return (
        matchesSearch && matchesCategory && matchesBrand && matchesSubBrand
      );
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, selectedSubBrand]);

  // ── Pricing ────────────────────────────────────────────────────────────────
  // Layering: per-item discount → cart-level coupon % → cart-level manual %
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + itemLineSubtotal(i), 0),
    [cart],
  );
  const itemDiscountTotal = useMemo(
    () => cart.reduce((s, i) => s + itemDiscountAmount(i), 0),
    [cart],
  );
  const afterItemDiscount = subtotal - itemDiscountTotal;
  const couponDiscountAmount = (afterItemDiscount * couponDiscountPercent) / 100;
  const afterCoupon = afterItemDiscount - couponDiscountAmount;
  const manualPct =
    typeof manualDiscountPercent === "number"
      ? Math.min(Math.max(manualDiscountPercent, 0), 100)
      : 0;
  const manualDiscountAmount = (afterCoupon * manualPct) / 100;
  const totalDiscountAmount =
    itemDiscountTotal + couponDiscountAmount + manualDiscountAmount;
  const grandTotal = afterCoupon - manualDiscountAmount;

  // ── Payment derived ────────────────────────────────────────────────────────
  const totalPaid = payments.reduce(
    (s, p) => s + (typeof p.amount === "number" ? p.amount : 0),
    0,
  );

  const cashChange = (() => {
    if (!splitMode) return 0;
    return totalPaid > grandTotal ? totalPaid - grandTotal : 0;
  })();

  const paymentShortfall = Math.max(0, grandTotal - totalPaid);

  // A split-mode row has an amount but no method chosen yet — checkout must block on this
  const hasUnselectedSplitMethod =
    splitMode &&
    payments.some(
      (p) => typeof p.amount === "number" && p.amount > 0 && p.method === "",
    );

  // ── Split payment: fixed 3-row layout ──────────────────────────────────────
  // Row 1 is editable. Row 2 is always the auto-calculated remaining amount.
  // Row 3 is always available for optional card/extra payment entry.
  const updateSplitAmount = useCallback(
    (idx: number, raw: string) => {
      const value: number | "" = raw === "" ? "" : Math.max(Number(raw), 0);

      setPayments((prev) => {
        const next: PaymentEntry[] = [
          prev[0] ?? { method: "upi", amount: "" },
          prev[1] ?? { method: "cash", amount: "" },
          prev[2] ?? { method: "card", amount: "" },
        ];

        next[idx] = { ...next[idx], amount: value };

        const firstAmount =
          typeof next[0].amount === "number"
            ? Math.min(next[0].amount, grandTotal)
            : 0;
        const thirdAmount =
          typeof next[2].amount === "number" ? next[2].amount : 0;

        next[0] = {
          ...next[0],
          amount: next[0].amount === "" ? "" : firstAmount,
        };

        // Cash row is editable. It auto-fills when UPI/Card changes,
        // but manual cash edits are preserved.
        if (idx !== 1) {
          next[1] = {
            ...next[1],
            amount: Math.max(0, grandTotal - firstAmount - thirdAmount),
          };
        }

        return next;
      });
    },
    [grandTotal],
  );

  // Keep fixed split rows and the cash remaining amount synced when total changes.
  useEffect(() => {
    if (!splitMode) return;
    setPayments((prev) => {
      const next: PaymentEntry[] = [
        prev[0] ?? { method: "upi", amount: "" },
        prev[1] ?? { method: "cash", amount: "" },
        prev[2] ?? { method: "card", amount: "" },
      ];
      const firstAmount =
        typeof next[0].amount === "number"
          ? Math.min(next[0].amount, grandTotal)
          : 0;
      const thirdAmount =
        typeof next[2].amount === "number" ? next[2].amount : 0;
      next[0] = {
        ...next[0],
        method: next[0].method || "upi",
        amount: next[0].amount === "" ? "" : firstAmount,
      };
      next[1] = {
        ...next[1],
        method: next[1].method || "cash",
        amount: Math.max(0, grandTotal - firstAmount - thirdAmount),
      };
      next[2] = { ...next[2], method: next[2].method || "card" };
      return next;
    });
  }, [grandTotal, splitMode]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product: POSProduct) => {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.warning(`Stock limit: ${product.stock}`);
        return;
      }
      setCart(
        cart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      if (product.stock <= 0) {
        toast.warning("Out of stock.");
        return;
      }
      setCart([...cart, { product, quantity: 1, discountPercent: 0 }]);
    }
    toast.success(`${product.name} added.`);
    focusBarcodeInput();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id !== productId) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null as any;
          if (next > item.product.stock) {
            toast.warning(`Stock limit: ${item.product.stock}`);
            return item;
          }
          return { ...item, quantity: next };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  // ← added: update a single cart line's discount percent
  const updateItemDiscount = (productId: string, raw: string) => {
    const value = raw === "" ? 0 : clampPercent(Number(raw));
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discountPercent: value }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) =>
    setCart(cart.filter((i) => i.product.id !== productId));

  const resetCart = () => {
    setCart([]);
    setCouponDiscountPercent(0);
    setManualDiscountPercent("");
    setCouponCode("");
    setAppliedCoupon("");
    setSelectedCustomer(WALK_IN_SENTINEL);
    setSelectedSalesman(NO_SALESMAN_SENTINEL);
    setPayments(DEFAULT_SINGLE_PAYMENT);
    setSplitMode(false);
    focusBarcodeInput();
  };

  // ── Barcode ────────────────────────────────────────────────────────────────
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = barcodeInput.trim().toLowerCase();
    if (!q) {
      focusBarcodeInput();
      return;
    }
    const found =
      products.find((p) => p.sku.toLowerCase() === q) ??
      products.find(
        (p) =>
          p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
      );
    if (found) {
      addToCart(found);
      setBarcodeInput("");
      setBarcodeNotFound(false);
    } else {
      setBarcodeNotFound(true);
      toast.error(`No product found for "${barcodeInput.trim()}"`);
    }
    focusBarcodeInput();
  };

  // ── Coupon ─────────────────────────────────────────────────────────────────
  const COUPONS: Record<string, number> = { WELCOME10: 10, SUPERERP: 20 };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (COUPONS[code] !== undefined) {
      setCouponDiscountPercent(COUPONS[code]);
      setAppliedCoupon(code);
      toast.success(`Coupon ${code} applied — ${COUPONS[code]}% off!`);
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  // ── Hold / Restore ─────────────────────────────────────────────────────────
  const holdBill = () => {
    if (!cart.length) {
      toast.warning("Cart is empty.");
      return;
    }
    const hold: HeldBill = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      cart,
      customerId: selectedCustomer,
      subtotal,
      couponCode: appliedCoupon,
      couponDiscountPercent,
      manualDiscountPercent,
      payments,
      splitMode,
    };
    setHeldBills([...heldBills, hold]);
    resetCart();
    toast.success(`Held: ${hold.id}`);
  };

  const restoreBill = (holdId: string) => {
    const ticket = heldBills.find((h) => h.id === holdId);
    if (!ticket) return;
    setCart(ticket.cart);
    setSelectedCustomer(ticket.customerId);
    setCouponCode(ticket.couponCode);
    setAppliedCoupon(ticket.couponCode);
    setCouponDiscountPercent(ticket.couponDiscountPercent);
    setManualDiscountPercent(ticket.manualDiscountPercent);
    setPayments(ticket.payments);
    setSplitMode(ticket.splitMode);
    setHeldBills(heldBills.filter((h) => h.id !== holdId));
    toast.success(`Restored: ${holdId}`);
    focusBarcodeInput();
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const checkout = () => {
    if (!cart.length) {
      toast.warning("Cart is empty.");
      return;
    }

    if (hasUnselectedSplitMethod) {
      toast.error("Select a payment method for the remaining amount.");
      return;
    }

    let customerIdForSale = selectedCustomer;
    if (selectedCustomer === WALK_IN_SENTINEL) {
      if (!walkInCustomerId) {
        toast.error(
          'No "Walk-in Customer" record found. Add one via the customer form, or pick a specific customer.',
        );
        return;
      }
      customerIdForSale = walkInCustomerId;
    }

    const now = new Date();
    const customer = customers.find((c) => c.id === selectedCustomer);
    const salesmanName =
      selectedSalesman !== NO_SALESMAN_SENTINEL
        ? (salesmen.find((s) => s.id === selectedSalesman)?.name ?? "")
        : "";

    const confirmedPayments = (() => {
      const valid = payments.filter(
        (p): p is { method: "cash" | "card" | "upi"; amount: number } =>
          typeof p.amount === "number" && p.amount > 0 && p.method !== "",
      );
      return valid.length > 0
        ? valid
        : [
          {
            method: (payments[0].method || "cash") as "cash" | "card" | "upi",
            amount: grandTotal,
          },
        ];
    })();

    const printSnapshot: Omit<PrintReceiptParams, "invoiceNo"> = {
      date: now,
      customerName: customer?.name ?? "",
      customerPhone: customer?.phone ?? "",
      salesmanName,
      items: cart.map((item) => ({
        name: item.product.name,
        sku: item.product.sku,
        qty: item.quantity,
        unitPrice: item.product.price,
        total: itemLineTotal(item),
      })),
      itemDiscount: itemDiscountTotal,
      couponDiscount: couponDiscountAmount,
      couponCode: appliedCoupon,
      manualDiscount: manualDiscountAmount,
      grandTotal,
      payments: confirmedPayments,
      change: cashChange,
    };

    setPendingPrint(printSnapshot);

    executeSale({
      customerId: customerIdForSale,
      branchId,
      salesmanId:
        selectedSalesman !== NO_SALESMAN_SENTINEL ? selectedSalesman : null,
      salesdate: now.toISOString(),
      status: "Dispatched",
      invoiceNo: "",
      grandTotal,
      dueAmount: 0,
      paidAmount: confirmedPayments.reduce((s, p) => s + p.amount, 0),
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discount: itemDiscountAmount(item),
        subtotal: itemLineSubtotal(item),
        total: itemLineTotal(item),
        purchasePrice: item.product.purchasePrice,
      })),
      salesPayment: (() => {
        const validEntries = payments.filter(
          (p) =>
            typeof p.amount === "number" &&
            (p.amount as number) > 0 &&
            p.method !== "",
        );
        const entries =
          validEntries.length > 0
            ? validEntries
            : [
              {
                method: (payments[0].method || "cash") as
                  "cash" | "card" | "upi",
                amount: grandTotal,
              },
            ];
        return entries.map((p) => ({
          amount: p.amount as number,
          paymentMethod: p.method,
          paidOn: now.toISOString(),
          paymentNote: appliedCoupon ? `Coupon: ${appliedCoupon}` : null,
          dueDate: null,
        }));
      })(),
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading POS terminal…
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <CustomerFormDialog
        open={addCustomerOpen}
        openChange={handleAddCustomerClose}
        branches={branchId ? [{ id: branchId, name: branchName }] : []}
      />

      {lastInvoiceOpen && lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Invoice {lastInvoice.invoiceNo}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lastInvoice.customerName || "Walk-in Customer"}
                  {lastInvoice.customerPhone
                    ? ` • ${lastInvoice.customerPhone}`
                    : ""}
                  {lastInvoice.salesmanName
                    ? ` • Salesman: ${lastInvoice.salesmanName}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setLastInvoiceOpen(false)}
              >
                ×
              </Button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">SKU</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items.map((item, index) => (
                      <tr
                        key={`${item.sku}-${index}`}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2 font-medium text-foreground">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {item.sku || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">{item.qty}</td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Discounts
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(lastInvoice.subtotal)}
                      </span>
                    </div>
                    {lastInvoice.itemDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Item Discounts</span>
                        <span>
                          -{formatCurrency(lastInvoice.itemDiscount)}
                        </span>
                      </div>
                    )}
                    {lastInvoice.couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Coupon{" "}
                          {lastInvoice.couponCode
                            ? `(${lastInvoice.couponCode})`
                            : ""}
                        </span>
                        <span>
                          -{formatCurrency(lastInvoice.couponDiscount)}
                        </span>
                      </div>
                    )}
                    {lastInvoice.manualDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Manual Discount</span>
                        <span>
                          -{formatCurrency(lastInvoice.manualDiscount)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-extrabold text-purple-700 dark:text-purple-400">
                      <span>Grand Total</span>
                      <span>{formatCurrency(lastInvoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payments
                  </h3>
                  <div className="space-y-1.5">
                    {lastInvoice.payments.map((payment, index) => (
                      <div
                        key={`${payment.method}-${index}`}
                        className="flex justify-between"
                      >
                        <span>{methodLabel(payment.method)}</span>
                        <span className="font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                    {lastInvoice.change > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Change Returned</span>
                        <span>{formatCurrency(lastInvoice.change)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border px-5 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLastInvoiceOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-purple-600 h-8 w-8" /> POS Billing
            Terminal
          </h1>
          <p className="text-muted-foreground text-sm">
            High-speed smart billing checkout
          </p>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/20 border-purple-200 w-fit"
        >
          Terminal Active • {branchName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── Left – Cart & Checkout (was on the right) ───────────────────── */}
        <div className="xl:col-span-7 flex flex-col gap-3 min-h-0">
          <Card className="border-border shadow-md bg-card flex h-[calc(100vh-170px)] min-h-[680px] max-h-[860px] flex-col overflow-hidden">
            {/* Cart header */}
            <CardHeader className="px-4 py-2.5 border-b border-border shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold">
                    Active Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage quantities and finalise
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {lastInvoice && (
                    <button
                      type="button"
                      onClick={() => setLastInvoiceOpen(true)}
                      className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300"
                      title="View last checked out invoice"
                    >
                      Last Invoice:{" "}
                      <span className="font-extrabold">
                        {lastInvoice.invoiceNo}
                      </span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={() => setCart([])}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Customer + add customer + salesman selectors */}
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                <Select
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 border-border bg-muted/30 text-xs">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` • ${c.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 justify-self-start md:justify-self-center"
                  title="Add new customer"
                  onClick={() => setAddCustomerOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 text-purple-600" />
                </Button>

                <Select
                  value={selectedSalesman}
                  onValueChange={setSelectedSalesman}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 border-border bg-muted/30 text-xs gap-1.5">
                    <UserCog className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Select salesman" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SALESMAN_SENTINEL}>
                      No Salesman
                    </SelectItem>
                    {salesmen.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer === WALK_IN_SENTINEL &&
                !walkInCustomerId &&
                cart.length > 0 && (
                  <p className="text-xs text-red-600 mt-1 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                    Couldn't set up a walk-in customer for this branch. Try
                    refreshing, or pick a specific customer.
                  </p>
                )}
            </CardHeader>

            {/* Cart items */}
            <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-2 space-y-1.5 pr-2 no-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold">POS Cart is Empty</p>
                  <p className="text-xs opacity-70">
                    Scan barcode or click products to add items
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 shadow-sm transition-colors hover:bg-muted/20"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">
                        {item.product.name}
                      </h4>
                      <p className="truncate text-[11px] text-muted-foreground">
                        SKU:{" "}
                        <span className="font-medium">
                          {item.product.sku || "—"}
                        </span>{" "}
                        • {formatCurrency(item.product.price)} / unit
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right min-w-[76px]">
                        <p className="text-[10px] text-muted-foreground">
                          Total
                        </p>
                        {item.discountPercent > 0 && (
                          <p className="text-[10px] text-muted-foreground line-through leading-none">
                            {formatCurrency(itemLineSubtotal(item))}
                          </p>
                        )}
                        <p className="text-sm font-extrabold text-purple-600">
                          {formatCurrency(itemLineTotal(item))}
                        </p>
                      </div>
                      <div className="flex items-center overflow-hidden rounded-md border border-border bg-card">
                        <button
                          type="button"
                          className="px-2 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-7 px-2 text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* ← added: per-line discount % input, spans the full row */}
                    <div className="col-span-2 flex items-center gap-1.5 -mt-0.5">
                      <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        value={item.discountPercent || ""}
                        onChange={(e) =>
                          updateItemDiscount(item.product.id, e.target.value)
                        }
                        className="h-6 w-16 text-[11px] px-1.5 bg-card"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        % off this item
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="text-[10px] text-green-600 font-semibold ml-auto">
                          −{formatCurrency(itemDiscountAmount(item))}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* ── Totals + Payment + Checkout ── */}
            <div className="shrink-0 border-t border-border bg-muted/20 p-3 space-y-1.5 rounded-b-xl">
              {/* Coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Coupon code…"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponDiscountPercent > 0}
                    className="pl-7 h-8 text-xs bg-card disabled:opacity-60"
                  />
                </div>
                {couponDiscountPercent > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setCouponDiscountPercent(0);
                      setCouponCode("");
                      setAppliedCoupon("");
                    }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={applyCoupon}
                  >
                    Apply
                  </Button>
                )}
              </div>

              {/* Manual discount */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Percent className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Instant discount %"
                    value={manualDiscountPercent}
                    onChange={(e) => {
                      const v = e.target.value;
                      setManualDiscountPercent(
                        v === "" ? "" : Math.min(Math.max(Number(v), 0), 100),
                      );
                    }}
                    className="pl-7 h-8 text-xs bg-card"
                  />
                </div>
                {manualPct > 0 && (
                  <button
                    type="button"
                    onClick={() => setManualDiscountPercent("")}
                    className="text-[10px] text-muted-foreground hover:text-destructive underline whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Cart Total:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {itemDiscountTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Item Discounts:
                    </span>
                    <span className="font-semibold">
                      −{formatCurrency(itemDiscountTotal)}
                    </span>
                  </div>
                )}
                {couponDiscountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Coupon ({appliedCoupon} –{" "}
                      {couponDiscountPercent}%):
                    </span>
                    <span className="font-semibold">
                      −{formatCurrency(couponDiscountAmount)}
                    </span>
                  </div>
                )}
                {manualPct > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Instant Discount (
                      {manualPct}%):
                    </span>
                    <span className="font-semibold">
                      −{formatCurrency(manualDiscountAmount)}
                    </span>
                  </div>
                )}
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium border-t border-dashed border-green-200 pt-1">
                    <span>Total Savings:</span>
                    <span>−{formatCurrency(totalDiscountAmount)}</span>
                  </div>
                )}
                <Separator className="my-1 bg-border" />
                <div className="flex justify-between text-sm font-extrabold text-purple-700 dark:text-purple-400">
                  <span>Total Payable:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* ── Payment Section ── */}
              <div className="space-y-1.5">
                {/* Header + Split toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSplitMode = !splitMode;
                      setSplitMode(nextSplitMode);
                      setPayments(
                        nextSplitMode
                          ? DEFAULT_SPLIT_PAYMENTS
                          : DEFAULT_SINGLE_PAYMENT,
                      );
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${splitMode
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-card text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                      }`}
                  >
                    {splitMode ? "✓ Split ON" : "Split Payment"}
                  </button>
                </div>

                {/* ── Single payment mode ── */}
                {!splitMode && (
                  <div className="space-y-1.5">
                    {/* Method picker */}
                    <div className="grid grid-cols-3 gap-2">
                      {(["cash", "card", "upi"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPayments([{ method, amount: "" }])}
                          className={`flex flex-col items-center p-1.5 border rounded-lg gap-1 text-[11px] font-bold transition-all ${payments[0].method === method
                            ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                        >
                          {method === "cash" && (
                            <IndianRupee className="h-4 w-4" />
                          )}
                          {method === "card" && (
                            <CreditCard className="h-4 w-4" />
                          )}
                          {method === "upi" && <Wallet className="h-4 w-4" />}
                          <span>
                            {method === "cash"
                              ? "Cash"
                              : method === "card"
                                ? "Card"
                                : "UPI"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Split payment mode ── */}
                {splitMode && (
                  <div className="space-y-1.5">
                    {payments.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={
                            entry.method ||
                            (idx === 0 ? "upi" : idx === 1 ? "cash" : "card")
                          }
                          onValueChange={(method) => {
                            const next = [...payments];
                            next[idx] = {
                              ...next[idx],
                              method: method as "cash" | "card" | "upi",
                            };
                            setPayments(next);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[120px] shrink-0 border-border bg-card text-xs">
                            {" "}
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="relative flex-1">
                          {" "}
                          <IndianRupee className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            placeholder={idx === 1 ? "Cash amount" : "Amount"}
                            value={entry.amount}
                            onChange={(e) =>
                              updateSplitAmount(idx, e.target.value)
                            }
                            className="pl-6 h-8 w-full text-xs bg-card"
                          />
                        </div>
                      </div>
                    ))}

                    {hasUnselectedSplitMethod && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                        Select a payment method for the remaining amount.
                      </p>
                    )}

                    {/* Split summary */}
                    <div className="rounded-md border border-border bg-muted/20 px-2.5 py-1.5 space-y-0.5 text-[11px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total entered:</span>
                        <span
                          className={`font-bold ${totalPaid >= grandTotal ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {formatCurrency(totalPaid)}
                        </span>
                      </div>
                      {paymentShortfall > 0.009 && (
                        <div className="flex justify-between text-red-500 font-semibold">
                          <span>Still needed:</span>
                          <span>{formatCurrency(paymentShortfall)}</span>
                        </div>
                      )}
                      {cashChange > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Change to return:</span>
                          <span>{formatCurrency(cashChange)}</span>
                        </div>
                      )}
                      {totalPaid >= grandTotal &&
                        paymentShortfall <= 0.009 &&
                        !hasUnselectedSplitMethod && (
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <span>✓</span> Payment complete
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hold + Checkout */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1 h-9 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-950/20"
                  onClick={holdBill}
                  disabled={isCheckingOut}
                >
                  <PauseCircle className="h-4 w-4" /> Hold
                </Button>
                <Button
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white gap-1 h-9 shadow-md shadow-purple-600/20 font-bold disabled:opacity-60"
                  onClick={checkout}
                  disabled={
                    isCheckingOut ||
                    cart.length === 0 ||
                    (selectedCustomer === WALK_IN_SENTINEL &&
                      !walkInCustomerId) ||
                    hasUnselectedSplitMethod
                  }
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving &
                      Printing…
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4" /> Checkout & Print
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full h-7 text-xs text-muted-foreground gap-1"
                onClick={resetCart}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Cart
              </Button>
            </div>
          </Card>

          {/* Held bills — grouped with cart/checkout since it's part of the billing flow */}
          {heldBills.length > 0 && (
            <Card className="border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 dark:border-yellow-900/30">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-yellow-800 dark:text-yellow-400">
                  <PauseCircle className="h-4 w-4" /> Held Transactions (
                  {heldBills.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-2 flex flex-wrap gap-2">
                {heldBills.map((h) => (
                  <Button
                    key={h.id}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 bg-card hover:bg-yellow-100 hover:text-yellow-900 dark:border-yellow-800"
                    onClick={() => restoreBill(h.id)}
                  >
                    {h.id}
                    <span className="text-[10px] opacity-75 font-normal ml-2">
                      ({formatCurrency(h.subtotal)})
                    </span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right – Products (was on the left) ──────────────────────────── */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Search + Filters */}
          <div className="flex flex-col gap-2">
            {/* Row 1: Search + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or name…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setBarcodeNotFound(false);
                  }}
                  className="pl-9 h-10 border-border bg-card shadow-sm"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="h-10 border-border bg-card shadow-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Brand + SubBrand */}
            <div className="grid grid-cols-2 gap-1">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-9 border-border bg-card shadow-sm text-sm">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Brands</SelectItem>
                  {brandOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedSubBrand}
                onValueChange={setSelectedSubBrand}
                disabled={
                  selectedBrand === "All" || subBrandOptions.length === 0
                }
              >
                <SelectTrigger className="h-9 border-border bg-card shadow-sm text-sm disabled:opacity-50">
                  <SelectValue
                    placeholder={
                      selectedBrand === "All"
                        ? "Select brand first"
                        : "All Sub-brands"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sub-brands</SelectItem>
                  {subBrandOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Barcode */}
          <form
            onSubmit={handleBarcodeSubmit}
            className={`flex gap-2 p-3 rounded-xl items-center shadow-sm border transition-colors ${barcodeNotFound
              ? "bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-900/40"
              : "bg-purple-50/50 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/40"
              }`}
          >
            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 hidden sm:inline shrink-0">
              Barcode Scanner:
            </span>
            <Input
              ref={barcodeInputRef}
              autoFocus
              placeholder="Scan / type SKU and hit Enter…"
              value={barcodeInput}
              onChange={(e) => {
                setBarcodeInput(e.target.value);
                setBarcodeNotFound(false);
              }}
              className={`h-8 text-xs bg-card ${barcodeNotFound
                ? "border-red-300 focus-visible:ring-red-400"
                : "border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
                }`}
            />
            <Button
              type="submit"
              size="sm"
              className={`h-8 text-xs text-white shrink-0 transition-colors ${barcodeNotFound
                ? "bg-red-500 hover:bg-red-600"
                : "bg-purple-600 hover:bg-purple-700"
                }`}
            >
              Scan
            </Button>
          </form>

          {/* Product grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-muted/40
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-purple-300
            dark:[&::-webkit-scrollbar-thumb]:bg-purple-700"
          >
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center text-muted-foreground py-16 text-sm">
                {searchTerm ||
                  selectedCategory !== "All" ||
                  selectedBrand !== "All"
                  ? "No products match your filters."
                  : "No products available."}
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <Card
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="cursor-pointer hover:border-purple-500 transition-all hover:shadow-md bg-card group border border-border flex flex-col justify-between h-36"
                >
                  <CardContent className="p-3.5 flex flex-col justify-between h-full w-full">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {prod.sku}
                        </span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${prod.stock <= 5
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-purple-50 text-purple-700 border-purple-100"
                            }`}
                        >
                          Stock: {prod.stock}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">
                        {prod.name}
                      </h3>
                      {prod.brand && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {prod.brand}
                          {prod.subBrand ? ` › ${prod.subBrand}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-border/80">
                      <span className="font-extrabold text-base text-purple-600">
                        {formatCurrency(prod.price)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-slate-50 dark:bg-slate-900 border-slate-200"
                      >
                        {prod.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}