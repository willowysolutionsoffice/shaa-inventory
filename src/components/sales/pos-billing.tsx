// src/components/sales/pos-billing.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Trash2, Plus, Minus, Percent, CreditCard, Wallet, Receipt,
  UserPlus, PauseCircle, ShoppingBag, Tag, Sparkles,
  Loader2, IndianRupee,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Badge }     from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast }     from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useRouter }      from "next/navigation";
import { useAction }      from "next-safe-action/hooks";
import { createSale }     from "@/actions/sales-action";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { getProductDropdown }         from "@/actions/product-actions";
import { CustomerFormDialog } from "@/components/customers/customer-form";

// ── Types ─────────────────────────────────────────────────────────────────────

interface POSProduct {
  id:            string;
  name:          string;
  sku:           string;
  price:         number;
  purchasePrice: number;
  stock:         number;
  category:      string;
}

interface POSCustomer {
  id:    string;
  name:  string;
  phone: string;
}

interface CartItem {
  product:  POSProduct;
  quantity: number;
}

interface HeldBill {
  id:                    string;
  cart:                  CartItem[];
  customerId:            string;
  subtotal:              number;
  couponCode:            string;
  couponDiscountPercent: number;
  manualDiscountPercent: number | "";
  payments:              PaymentEntry[];
  splitMode:             boolean;
}

// ── NEW: multi-payment entry ──────────────────────────────────────────────────
interface PaymentEntry {
  method: "cash" | "card" | "upi";
  amount: number | "";
}

const WALK_IN_SENTINEL = "__walk_in__";

// ── Component ─────────────────────────────────────────────────────────────────

export default function PosBillingPage({
  branchId   = "",
  branchName = "Branch",
}: {
  branchId?:   string;
  branchName?: string;
}) {
  const router = useRouter();

  // ── Remote data ────────────────────────────────────────────────────────────
  const [products,    setProducts]    = useState<POSProduct[]>([]);
  const [customers,   setCustomers]   = useState<POSCustomer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    const custRes = await getCustomerListForDropdown();
    const remoteCustomers: POSCustomer[] = (custRes ?? []).map((c: any) => ({
      id:    c.id,
      name:  c.name,
      phone: c.phone ?? "",
    }));
    setCustomers([
      { id: WALK_IN_SENTINEL, name: "Select a Customer", phone: "" },
      ...remoteCustomers,
    ]);
    return remoteCustomers;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [, prodRes] = await Promise.all([
          fetchCustomers(),
          getProductDropdown({ query: "" }),
        ]);
        setProducts((prodRes ?? []).map((p: any) => ({
          id:            p.id,
          name:          p.product_name ?? p.productName ?? "Unknown",
          sku:           p.sku ?? "",
          price:         Number(p.sellingPrice  ?? p.purchasePrice ?? 0),
          purchasePrice: Number(p.purchasePrice ?? 0),
          stock:         Number(p.stock         ?? 0),
          category:      p.category?.name ?? p.category ?? "General",
        })));
      } catch (err: any) {
        console.error("[POS load]", err);
        toast.error("Failed to load POS terminal data.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [fetchCustomers]);

  const handleAddCustomerClose = useCallback(
    async (open: boolean) => {
      setAddCustomerOpen(open);
      if (!open) {
        try {
          const prevIds = new Set(customers.map((c) => c.id));
          const fresh   = await fetchCustomers();
          const newEntry = fresh.find((c) => !prevIds.has(c.id));
          if (newEntry) {
            setSelectedCustomer(newEntry.id);
            toast.success(`"${newEntry.name}" added and selected.`);
          }
        } catch {}
      }
    },
    [fetchCustomers, customers]
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchTerm,            setSearchTerm]            = useState("");
  const [selectedCategory,      setSelectedCategory]      = useState("All");
  const [barcodeInput,          setBarcodeInput]          = useState("");
  const [selectedCustomer,      setSelectedCustomer]      = useState(WALK_IN_SENTINEL);
  const [cart,                  setCart]                  = useState<CartItem[]>([]);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number | "">("");
  const [couponCode,            setCouponCode]            = useState("");
  const [appliedCoupon,         setAppliedCoupon]         = useState("");
  const [heldBills,             setHeldBills]             = useState<HeldBill[]>([]);

  // ── NEW: payment state ─────────────────────────────────────────────────────
  const [payments,  setPayments]  = useState<PaymentEntry[]>([{ method: "cash", amount: "" }]);
  const [splitMode, setSplitMode] = useState(false);

  // ── Server action ──────────────────────────────────────────────────────────
  const { execute: executeSale, isExecuting: isCheckingOut } = useAction(createSale, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      const saleId = (data as any)?.id ?? (data as any)?.data?.id;
      if (saleId) {
        resetCart();
        toast.success("Checkout complete! Opening receipt…");
        router.push(`/sales/pos/invoice/${saleId}`);
      } else {
        toast.error("Sale saved but no ID returned.");
      }
    },
    onError: (err) => {
      console.error("[POS checkout error]", err);
      toast.error("Checkout failed. Please try again.");
    },
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
        (selectedCategory === "All" || p.category === selectedCategory)
    );
  }, [products, searchTerm, selectedCategory]);

  // ── Pricing ────────────────────────────────────────────────────────────────
  const subtotal             = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;
  const afterCoupon          = subtotal - couponDiscountAmount;
  const manualPct            = typeof manualDiscountPercent === "number" ? Math.min(Math.max(manualDiscountPercent, 0), 100) : 0;
  const manualDiscountAmount = (afterCoupon * manualPct) / 100;
  const totalDiscountAmount  = couponDiscountAmount + manualDiscountAmount;
  const grandTotal           = subtotal - totalDiscountAmount;

  // ── Payment derived ────────────────────────────────────────────────────────
  const totalPaid = payments.reduce((s, p) => s + (typeof p.amount === "number" ? p.amount : 0), 0);

  const cashChange = (() => {
    if (!splitMode) {
      const p = payments[0];
      return p.method === "cash" && typeof p.amount === "number" && p.amount > grandTotal
        ? p.amount - grandTotal : 0;
    }
    return totalPaid > grandTotal ? totalPaid - grandTotal : 0;
  })();

  const paymentShortfall = Math.max(0, grandTotal - totalPaid);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product: POSProduct) => {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) { toast.warning(`Stock limit: ${product.stock}`); return; }
      setCart(cart.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock <= 0) { toast.warning("Out of stock."); return; }
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success(`${product.name} added.`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id !== productId) return item;
        const next = item.quantity + delta;
        if (next <= 0) return null as any;
        if (next > item.product.stock) { toast.warning(`Stock limit: ${item.product.stock}`); return item; }
        return { ...item, quantity: next };
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((i) => i.product.id !== productId));

  const resetCart = () => {
    setCart([]);
    setCouponDiscountPercent(0);
    setManualDiscountPercent("");
    setCouponCode("");
    setAppliedCoupon("");
    setSelectedCustomer(WALK_IN_SENTINEL);
    setPayments([{ method: "cash", amount: "" }]);
    setSplitMode(false);
  };

  // ── Barcode ────────────────────────────────────────────────────────────────
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = products.find((p) => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (found) { addToCart(found); setBarcodeInput(""); }
    else toast.error("No product found for that SKU.");
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
    if (!cart.length) { toast.warning("Cart is empty."); return; }
    const hold: HeldBill = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      cart,
      customerId:            selectedCustomer,
      subtotal,
      couponCode:            appliedCoupon,
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
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const checkout = () => {
    if (!cart.length) { toast.warning("Cart is empty."); return; }
    if (selectedCustomer === WALK_IN_SENTINEL) {
      toast.error("Please select a customer before checking out.");
      return;
    }
    if (paymentShortfall > 0.009) {
      toast.error("Payment amount doesn't cover the total.");
      return;
    }

    const now = new Date().toISOString();

    executeSale({
      customerId: selectedCustomer,
      branchId,
      salesdate:  now,
      status:     "Dispatched",
      invoiceNo:  "",
      grandTotal,
      dueAmount:  0,
      paidAmount: totalPaid,
      items: cart.map((item) => ({
        productId:     item.product.id,
        quantity:      item.quantity,
        unitPrice:     item.product.price,
        discount:      0,
        subtotal:      item.product.price * item.quantity,
        total:         item.product.price * item.quantity,
        purchasePrice: item.product.purchasePrice,
      })),
      salesPayment: payments
        .filter((p) => typeof p.amount === "number" && p.amount > 0)
        .map((p) => ({
          amount:        p.amount as number,
          paymentMethod: p.method,
          paidOn:        now,
          paymentNote:   appliedCoupon ? `Coupon: ${appliedCoupon}` : null,
          dueDate:       null,
        })),
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

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-purple-600 h-8 w-8" /> POS Billing Terminal
          </h1>
          <p className="text-muted-foreground text-sm">High-speed smart billing checkout</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/20 border-purple-200 w-fit">
          Terminal Active • {branchName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── Left – Products ─────────────────────────────────────────────── */}
        <div className="xl:col-span-7 flex flex-col gap-4">

          {/* Search + Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU or name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-border bg-card shadow-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 border-border bg-card shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Barcode */}
          <form
            onSubmit={handleBarcodeSubmit}
            className="flex gap-2 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40 p-3 rounded-xl items-center shadow-sm"
          >
            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 hidden sm:inline">
              Barcode Scanner:
            </span>
            <Input
              placeholder="Scan / type SKU and hit Enter…"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="h-8 text-xs border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500 bg-card"
            />
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs text-white">
              Scan
            </Button>
          </form>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="col-span-3 text-center text-muted-foreground py-16 text-sm">
                No products match your search.
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <Card
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`cursor-pointer hover:border-purple-500 transition-all hover:shadow-md bg-card group border border-border flex flex-col justify-between h-36 ${
                    prod.stock <= 0 ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <CardContent className="p-3.5 flex flex-col justify-between h-full w-full">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">{prod.sku}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${
                          prod.stock <= 5
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-purple-50 text-purple-700 border-purple-100"
                        }`}>
                          Stock: {prod.stock}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">
                        {prod.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-border/80">
                      <span className="font-extrabold text-base text-purple-600">{formatCurrency(prod.price)}</span>
                      <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-900 border-slate-200">
                        {prod.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Held bills */}
          {heldBills.length > 0 && (
            <Card className="border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 dark:border-yellow-900/30">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-yellow-800 dark:text-yellow-400">
                  <PauseCircle className="h-4 w-4" /> Held Transactions ({heldBills.length})
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
                    <span className="text-[10px] opacity-75 font-normal ml-2">({formatCurrency(h.subtotal)})</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right – Cart & Checkout ──────────────────────────────────────── */}
        <div className="xl:col-span-5">
          <Card className="border-border shadow-md bg-card flex flex-col h-[820px] justify-between">

            {/* Cart header */}
            <CardHeader className="py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Active Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </CardTitle>
                  <CardDescription className="text-xs">Manage quantities and finalise</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setCart([])}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Customer selector */}
              <div className="mt-4 flex gap-2">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-9 border-border bg-muted/30">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.phone ? ` • ${c.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  title="Add new customer"
                  onClick={() => setAddCustomerOpen(true)}
                >
                  <UserPlus className="h-4 w-4 text-purple-600" />
                </Button>
              </div>

              {selectedCustomer === WALK_IN_SENTINEL && cart.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                  Select a customer above before checking out.
                </p>
              )}
            </CardHeader>

            {/* Cart items */}
            <CardContent className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 no-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold">POS Cart is Empty</p>
                  <p className="text-xs opacity-70">Scan barcode or click products to add items</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center p-2.5 rounded-lg border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1 mr-3">
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(item.product.price)} / unit •{" "}
                        <span className="text-purple-600 font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                        <button type="button" className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors" onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 font-bold text-xs text-foreground">{item.quantity}</span>
                        <button type="button" className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors" onClick={() => updateQuantity(item.product.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button type="button" className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors" onClick={() => removeFromCart(item.product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* ── Totals + Payment + Checkout ── */}
            <div className="border-t border-border bg-muted/20 p-4 space-y-3 rounded-b-xl">

              {/* Coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Coupon code…"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponDiscountPercent > 0}
                    className="pl-8 h-9 text-xs bg-card disabled:opacity-60"
                  />
                </div>
                {couponDiscountPercent > 0 ? (
                  <Button size="sm" variant="outline" className="h-9 px-3 text-xs text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => { setCouponDiscountPercent(0); setCouponCode(""); setAppliedCoupon(""); }}>
                    Remove
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-9 px-3 text-xs" onClick={applyCoupon}>Apply</Button>
                )}
              </div>

              {/* Manual discount */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Percent className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number" min={0} max={100}
                    placeholder="Instant discount %"
                    value={manualDiscountPercent}
                    onChange={(e) => {
                      const v = e.target.value;
                      setManualDiscountPercent(v === "" ? "" : Math.min(Math.max(Number(v), 0), 100));
                    }}
                    className="pl-8 h-9 text-xs bg-card"
                  />
                </div>
                {manualPct > 0 && (
                  <button type="button" onClick={() => setManualDiscountPercent("")} className="text-[10px] text-muted-foreground hover:text-destructive underline whitespace-nowrap">
                    Clear
                  </button>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Cart Total:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                {couponDiscountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Coupon ({appliedCoupon} – {couponDiscountPercent}%):
                    </span>
                    <span className="font-semibold">−{formatCurrency(couponDiscountAmount)}</span>
                  </div>
                )}
                {manualPct > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Instant Discount ({manualPct}%):
                    </span>
                    <span className="font-semibold">−{formatCurrency(manualDiscountAmount)}</span>
                  </div>
                )}
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium border-t border-dashed border-green-200 pt-1">
                    <span>Total Savings:</span>
                    <span>−{formatCurrency(totalDiscountAmount)}</span>
                  </div>
                )}
                <Separator className="my-1 bg-border" />
                <div className="flex justify-between text-base font-extrabold text-purple-700 dark:text-purple-400">
                  <span>Total Payable:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* ── Payment Section ── */}
              <div className="space-y-2">
                {/* Header + Split toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMode(!splitMode);
                      setPayments([{ method: "cash", amount: "" }]);
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      splitMode
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-card text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                    }`}
                  >
                    {splitMode ? "✓ Split ON" : "Split Payment"}
                  </button>
                </div>

                {/* ── Single payment mode ── */}
                {!splitMode && (
                  <div className="space-y-2">
                    {/* Method picker */}
                    <div className="grid grid-cols-3 gap-2">
                      {(["cash", "card", "upi"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPayments([{ method, amount: payments[0].amount }])}
                          className={`flex flex-col items-center p-2.5 border rounded-xl gap-1 text-[11px] font-bold transition-all ${
                            payments[0].method === method
                              ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {method === "cash" && <IndianRupee className="h-4 w-4" />}
                          {method === "card" && <CreditCard className="h-4 w-4" />}
                          {method === "upi"  && <Wallet className="h-4 w-4" />}
                          <span>{method === "cash" ? "Cash" : method === "card" ? "Card" : "UPI"}</span>
                        </button>
                      ))}
                    </div>

                    {/* Cash: tendered amount input */}
                    {payments[0].method === "cash" && (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <IndianRupee className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min={0}
                              placeholder={`Cash tendered (min ${formatCurrency(grandTotal)})`}
                              value={payments[0].amount}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPayments([{ method: "cash", amount: v === "" ? "" : Math.max(Number(v), 0) }]);
                              }}
                              className="pl-8 h-9 text-xs bg-card"
                            />
                          </div>
                          {payments[0].amount !== "" && (
                            <button type="button" onClick={() => setPayments([{ method: "cash", amount: "" }])}
                              className="text-[10px] text-muted-foreground hover:text-destructive underline whitespace-nowrap">
                              Clear
                            </button>
                          )}
                        </div>
                        {cashChange > 0 && (
                          <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded px-2 py-1.5">
                            <span>Change to return:</span>
                            <span>{formatCurrency(cashChange)}</span>
                          </div>
                        )}
                        {typeof payments[0].amount === "number" && payments[0].amount > 0 && payments[0].amount < grandTotal && (
                          <p className="text-xs text-red-500 px-1">Amount is less than total payable.</p>
                        )}
                      </div>
                    )}

                    {/* Card / UPI: quick exact-amount button */}
                    {payments[0].method !== "cash" && (
                      <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                        <span>Amount:</span>
                        <span className="font-bold text-foreground">{formatCurrency(grandTotal)}</span>
                        <button
                          type="button"
                          className="ml-auto text-[10px] text-purple-600 underline"
                          onClick={() => setPayments([{ ...payments[0], amount: grandTotal }])}
                        >
                          Set exact
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Split payment mode ── */}
                {splitMode && (
                  <div className="space-y-2">
                    {payments.map((entry, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        {/* Compact method toggle */}
                        <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
                          {(["cash", "card", "upi"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const next = [...payments];
                                next[idx] = { ...next[idx], method: m };
                                setPayments(next);
                              }}
                              className={`px-2 py-1.5 text-[10px] font-bold transition-all ${
                                entry.method === m
                                  ? "bg-purple-600 text-white"
                                  : "bg-card text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {m === "cash" ? "₹" : m === "card" ? "Card" : "UPI"}
                            </button>
                          ))}
                        </div>

                        {/* Amount */}
                        <div className="relative flex-1">
                          <IndianRupee className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Amount"
                            value={entry.amount}
                            onChange={(e) => {
                              const next = [...payments];
                              next[idx] = {
                                ...next[idx],
                                amount: e.target.value === "" ? "" : Math.max(Number(e.target.value), 0),
                              };
                              setPayments(next);
                            }}
                            className="pl-6 h-8 text-xs bg-card"
                          />
                        </div>

                        {/* Fill remaining */}
                        <button
                          type="button"
                          title="Fill remaining balance"
                          onClick={() => {
                            const otherTotal = payments
                              .filter((_, i) => i !== idx)
                              .reduce((s, p) => s + (typeof p.amount === "number" ? p.amount : 0), 0);
                            const remaining = Math.max(0, grandTotal - otherTotal);
                            const next = [...payments];
                            next[idx] = { ...next[idx], amount: remaining };
                            setPayments(next);
                          }}
                          className="text-[10px] text-purple-600 border border-purple-200 rounded px-1.5 py-1 hover:bg-purple-50 dark:hover:bg-purple-950/20 shrink-0 whitespace-nowrap"
                        >
                          Rem.
                        </button>

                        {/* Remove row */}
                        {payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-red-500 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add method (max 3) */}
                    {payments.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setPayments([...payments, { method: "cash", amount: "" }])}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold px-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add payment method
                      </button>
                    )}

                    {/* Split summary */}
                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 space-y-1 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total entered:</span>
                        <span className={`font-bold ${totalPaid >= grandTotal ? "text-emerald-600" : "text-amber-600"}`}>
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
                      {totalPaid >= grandTotal && paymentShortfall <= 0.009 && (
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
                  className="flex-1 gap-1 h-11 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-950/20"
                  onClick={holdBill}
                  disabled={isCheckingOut}
                >
                  <PauseCircle className="h-4 w-4" /> Hold
                </Button>
                <Button
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white gap-1 h-11 shadow-md shadow-purple-600/20 font-bold disabled:opacity-60"
                  onClick={checkout}
                  disabled={
                    isCheckingOut ||
                    cart.length === 0 ||
                    selectedCustomer === WALK_IN_SENTINEL ||
                    paymentShortfall > 0.009
                  }
                >
                  {isCheckingOut
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                    : <><Receipt className="h-4 w-4" /> Complete Checkout</>
                  }
                </Button>
              </div>

              <Button variant="ghost" className="w-full text-xs text-muted-foreground gap-1" onClick={() => router.push("/sales/pos")}>
                <Receipt className="h-3.5 w-3.5" /> New Transaction
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}