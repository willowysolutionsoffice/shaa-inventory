// src/components/sales/use-pos-cart.ts
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  CartItem,
  HeldBill,
  POSProduct,
  PaymentEntry,
  DEFAULT_SINGLE_PAYMENT,
  DEFAULT_SPLIT_PAYMENTS,
  WALK_IN_SENTINEL,
  NO_SALESMAN_SENTINEL,
  clampPercent,
  itemDiscountAmount,
  itemLineSubtotal,
  getLocalDateInputValue,
} from "./pos-types";

const COUPONS: Record<string, number> = { WELCOME10: 10, SUPERERP: 20 };

export function usePosCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number | "">("");
  const [manualDiscountAmount, setManualDiscountAmount] = useState<number | "">("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(() => getLocalDateInputValue());
  const [selectedCustomer, setSelectedCustomer] = useState(WALK_IN_SENTINEL);
  const [selectedSalesman, setSelectedSalesman] = useState(NO_SALESMAN_SENTINEL);

  // ── Payment State ───────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentEntry[]>(DEFAULT_SINGLE_PAYMENT);
  const [splitMode, setSplitMode] = useState(false);

  // ── Pricing Calculations ───────────────────────────────────────────────────
  // Layering: per-item discount → cart-level coupon % → cart-level manual % / ₹
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

  const manualPct = useMemo(
    () =>
      typeof manualDiscountPercent === "number"
        ? Math.min(Math.max(manualDiscountPercent, 0), 100)
        : 0,
    [manualDiscountPercent],
  );

  const manualAmt = useMemo(
    () =>
      typeof manualDiscountAmount === "number"
        ? Math.max(manualDiscountAmount, 0)
        : 0,
    [manualDiscountAmount],
  );

  const manualDiscountCalculated = (afterCoupon * manualPct) / 100 + manualAmt;
  const totalDiscountAmount =
    itemDiscountTotal + couponDiscountAmount + manualDiscountCalculated;
  const grandTotal = afterCoupon - manualDiscountCalculated;

  // ── Payment Derived ────────────────────────────────────────────────────────
  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (s, p) => s + (typeof p.amount === "number" ? p.amount : 0),
        0,
      ),
    [payments],
  );

  const cashChange = useMemo(() => {
    if (!splitMode) return 0;
    return totalPaid > grandTotal ? totalPaid - grandTotal : 0;
  }, [splitMode, totalPaid, grandTotal]);

  const paymentShortfall = useMemo(
    () => Math.max(0, grandTotal - totalPaid),
    [grandTotal, totalPaid],
  );

  const hasUnselectedSplitMethod = useMemo(
    () =>
      splitMode &&
      payments.some(
        (p) => typeof p.amount === "number" && p.amount > 0 && p.method === "",
      ),
    [splitMode, payments],
  );

  // ── Split payment auto-sync ────────────────────────────────────────────────
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

  // Keep fixed split rows and the cash remaining amount synced when total changes
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

  // ── Cart Actions ───────────────────────────────────────────────────────────
  const addToCart = useCallback((product: POSProduct, onAdded?: () => void) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Stock limit: ${product.stock}`);
          return prevCart;
        }
        return prevCart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        if (product.stock <= 0) {
          toast.warning("Out of stock.");
          return prevCart;
        }
        return [
          ...prevCart,
          { product, quantity: 1, discountPercent: 0, discountAmount: 0 },
        ];
      }
    });
    toast.success(`${product.name} added.`);
    if (onAdded) onAdded();
  }, []);

  const setExactQuantity = useCallback((productId: string, qty: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id !== productId) return item;
          const next = Math.max(0, qty);
          if (next <= 0) return null as any;
          if (next > item.product.stock) {
            toast.warning(`Stock limit: ${item.product.stock}`);
            return { ...item, quantity: item.product.stock };
          }
          return { ...item, quantity: next };
        })
        .filter(Boolean) as CartItem[],
    );
  }, []);

  const updateItemPrice = useCallback((productId: string, price: number) => {
    const validPrice = Math.max(0, price);
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: {
                ...item.product,
                price: validPrice,
              },
            }
          : item,
      ),
    );
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
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
  }, []);

  const updateItemDiscount = useCallback((productId: string, raw: string) => {
    const value = raw === "" ? 0 : clampPercent(Number(raw));
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discountPercent: value }
          : item,
      ),
    );
  }, []);

  const updateItemDiscountAmount = useCallback((productId: string, raw: string) => {
    const value = raw === "" ? 0 : Math.max(0, Number(raw));
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discountAmount: value }
          : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const resetCart = useCallback((onReset?: () => void) => {
    setCart([]);
    setCouponDiscountPercent(0);
    setManualDiscountPercent("");
    setManualDiscountAmount("");
    setCouponCode("");
    setAppliedCoupon("");
    setSelectedCustomer(WALK_IN_SENTINEL);
    setSelectedSalesman(NO_SALESMAN_SENTINEL);
    setPayments(DEFAULT_SINGLE_PAYMENT);
    setSplitMode(false);
    setInvoiceDate(getLocalDateInputValue());
    if (onReset) onReset();
  }, []);

  // ── Coupon Actions ─────────────────────────────────────────────────────────
  const applyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    if (COUPONS[code] !== undefined) {
      setCouponDiscountPercent(COUPONS[code]);
      setAppliedCoupon(code);
      toast.success(`Coupon ${code} applied — ${COUPONS[code]}% off!`);
    } else {
      toast.error("Invalid coupon code.");
    }
  }, [couponCode]);

  const removeCoupon = useCallback(() => {
    setCouponDiscountPercent(0);
    setCouponCode("");
    setAppliedCoupon("");
  }, []);

  const clearManualDiscount = useCallback(() => {
    setManualDiscountPercent("");
    setManualDiscountAmount("");
  }, []);

  // ── Payment Mode Actions ───────────────────────────────────────────────────
  const toggleSplitMode = useCallback(() => {
    setSplitMode((prev) => {
      const next = !prev;
      setPayments(next ? DEFAULT_SPLIT_PAYMENTS : DEFAULT_SINGLE_PAYMENT);
      return next;
    });
  }, []);

  const setSinglePaymentMethod = useCallback((method: "cash" | "card" | "upi") => {
    setPayments([{ method, amount: "" }]);
  }, []);

  const updateSplitMethod = useCallback((idx: number, method: "cash" | "card" | "upi") => {
    setPayments((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], method };
      return next;
    });
  }, []);

  // ── Hold / Restore Actions ─────────────────────────────────────────────────
  const holdBill = useCallback(() => {
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
      manualDiscountAmount,
      payments,
      splitMode,
      invoiceDate,
    };
    setHeldBills((prev) => [...prev, hold]);
    resetCart();
    toast.success(`Held: ${hold.id}`);
  }, [
    cart,
    selectedCustomer,
    subtotal,
    appliedCoupon,
    couponDiscountPercent,
    manualDiscountPercent,
    manualDiscountAmount,
    payments,
    splitMode,
    invoiceDate,
    resetCart,
  ]);

  const restoreBill = useCallback(
    (holdId: string, onRestored?: () => void) => {
      const ticket = heldBills.find((h) => h.id === holdId);
      if (!ticket) return;
      setCart(ticket.cart);
      setSelectedCustomer(ticket.customerId);
      setCouponCode(ticket.couponCode);
      setAppliedCoupon(ticket.couponCode);
      setCouponDiscountPercent(ticket.couponDiscountPercent);
      setManualDiscountPercent(ticket.manualDiscountPercent);
      setManualDiscountAmount(ticket.manualDiscountAmount);
      setPayments(ticket.payments);
      setSplitMode(ticket.splitMode);
      setInvoiceDate(ticket.invoiceDate);
      setHeldBills((prev) => prev.filter((h) => h.id !== holdId));
      toast.success(`Restored: ${holdId}`);
      if (onRestored) onRestored();
    },
    [heldBills],
  );

  const deleteHeldBill = useCallback((holdId: string) => {
    setHeldBills((prev) => prev.filter((h) => h.id !== holdId));
  }, []);

  return {
    // States
    cart,
    setCart,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponDiscountPercent,
    manualDiscountPercent,
    setManualDiscountPercent,
    manualDiscountAmount,
    setManualDiscountAmount,
    heldBills,
    invoiceDate,
    setInvoiceDate,
    selectedCustomer,
    setSelectedCustomer,
    selectedSalesman,
    setSelectedSalesman,
    payments,
    setPayments,
    splitMode,
    // Calculations
    subtotal,
    itemDiscountTotal,
    afterItemDiscount,
    couponDiscountAmount,
    afterCoupon,
    manualPct,
    manualAmt,
    manualDiscountCalculated,
    totalDiscountAmount,
    grandTotal,
    totalPaid,
    cashChange,
    paymentShortfall,
    hasUnselectedSplitMethod,
    // Actions
    addToCart,
    setExactQuantity,
    updateQuantity,
    updateItemPrice,
    updateItemDiscount,
    updateItemDiscountAmount,
    removeFromCart,
    resetCart,
    applyCoupon,
    removeCoupon,
    clearManualDiscount,
    toggleSplitMode,
    setSinglePaymentMethod,
    updateSplitMethod,
    updateSplitAmount,
    holdBill,
    restoreBill,
    deleteHeldBill,
  };
}
