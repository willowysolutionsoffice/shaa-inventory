"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  Percent, 
  CreditCard, 
  Wallet, 
  Receipt, 
  UserPlus, 
  PauseCircle, 
  CheckCircle,
  Sparkles,
  ShoppingBag,
  Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee } from "lucide-react";

const POS_PRODUCTS = [
  { id: "prod-1", name: "Gulaal Delia Lawn – Unstitched 3-Piece", sku: "GUL-DELIA-LP-01", price: 4999, stock: 24, category: "Unstitched" },
  { id: "prod-2", name: "Gul Ahmed Summer Lawn – Unstitched 3-Piece", sku: "GA-SML-UP-02", price: 3799, stock: 30, category: "Unstitched" },
  { id: "prod-3", name: "Sapphire Eid Festive Unstitched – Embroidered", sku: "SAP-EID-EU-03", price: 6999, stock: 15, category: "Unstitched" },
  { id: "prod-4", name: "Gulaal Mahi Collection – Unstitched Khaddar", sku: "GUL-MAHI-KH-04", price: 4299, stock: 18, category: "Unstitched" },
  { id: "prod-5", name: "Banarasi Pure Silk Saree – Zari Border", sku: "BAN-SILK-ZB-05", price: 8999, stock: 10, category: "Sarees" },
  { id: "prod-6", name: "Kota Doria Cotton-Silk Saree – Block Print", sku: "KOTA-CS-BP-06", price: 1999, stock: 20, category: "Sarees" },
  { id: "prod-7", name: "Georgette Embroidered Saree – Party Wear", sku: "GEO-EMB-PW-07", price: 3499, stock: 12, category: "Sarees" },
  { id: "prod-8", name: "Kerala Kasavu Saree – Pure Cotton", sku: "KER-KAS-CM-08", price: 1399, stock: 35, category: "Sarees" },
  { id: "prod-9", name: "Anarkali Rayon Kurti – Printed Long", sku: "ANK-RAY-PL-XL-09", price: 799, stock: 40, category: "Kurtis" },
  { id: "prod-10", name: "Palazzo Kurti Set – Muslin with Dupatta", sku: "PAL-MUS-DP-10", price: 1099, stock: 25, category: "Kurtis" },
  { id: "prod-11", name: "Pure Linen Fabric – Solid – Per Metre", sku: "LIN-SOL-PM-11", price: 299, stock: 200, category: "Fabrics" },
  { id: "prod-12", name: "Chiffon Printed Fabric – Per Metre", sku: "CHF-PRT-PM-12", price: 199, stock: 150, category: "Fabrics" },
  { id: "prod-13", name: "Embroidered Organza Dupatta – Bridal", sku: "ORG-EMB-BD-13", price: 1499, stock: 22, category: "Dupattas" },
  { id: "prod-14", name: "Gul Ahmed Silk Dupatta – Digital Print", sku: "GA-SILK-DP-14", price: 999, stock: 30, category: "Dupattas" },
  { id: "prod-15", name: "Sapphire Ready-to-Wear Embroidered Suit", sku: "SAP-RTW-ES-15", price: 7999, stock: 8, category: "Readymade" },
];

const CUSTOMERS = [
  { id: "cust-walk", name: "Walk-in Customer", phone: "", type: "Retail" },
  { id: "cust-1", name: "Fathima Beevi K", phone: "9447112345", type: "Retail" },
  { id: "cust-2", name: "Zainab Hussain", phone: "9895234567", type: "VIP" },
  { id: "cust-3", name: "Mariyam Siddique", phone: "9745345678", type: "Retail" },
  { id: "cust-4", name: "Anitha Krishnan", phone: "9387456789", type: "Wholesale" },
  { id: "cust-5", name: "Reshma Abdul Razak", phone: "9656567890", type: "Retail" },
];

interface CartItem {
  product: typeof POS_PRODUCTS[0];
  quantity: number;
}

export default function PosBillingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("cust-walk");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Two separate discount states
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(0);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number | "">("");

  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [heldBills, setHeldBills] = useState<Array<{ id: string; cart: CartItem[]; customerId: string; subtotal: number }>>([]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(POS_PRODUCTS.map((p) => p.category)))];
  }, []);

  const filteredProducts = useMemo(() => {
    return POS_PRODUCTS.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const addToCart = (product: typeof POS_PRODUCTS[0]) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.warning(`Cannot exceed available stock of ${product.stock} units.`);
        return;
      }
      setCart(cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart.`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) {
              toast.warning(`Cannot exceed available stock of ${item.product.stock} units.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    toast.info("Item removed from terminal cart.");
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = POS_PRODUCTS.find((p) => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (found) {
      addToCart(found);
      setBarcodeInput("");
    } else {
      toast.error("Invalid Barcode. No matching product SKU found.");
    }
  };

  // ── Pricing ────────────────────────────────────────────────────────────────

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Coupon discount applied first
  const couponDiscountAmount = useMemo(() => {
    return (subtotal * couponDiscountPercent) / 100;
  }, [subtotal, couponDiscountPercent]);

  // Manual discount applied on top of coupon-discounted price
  const afterCoupon = subtotal - couponDiscountAmount;
  const manualPct = typeof manualDiscountPercent === "number" ? Math.min(Math.max(manualDiscountPercent, 0), 100) : 0;
  const manualDiscountAmount = useMemo(() => {
    return (afterCoupon * manualPct) / 100;
  }, [afterCoupon, manualPct]);

  const totalDiscountAmount = couponDiscountAmount + manualDiscountAmount;

  const taxBase = subtotal - totalDiscountAmount;
  const taxAmount = useMemo(() => (taxBase * 12) / 100, [taxBase]);
  const grandTotal = useMemo(() => taxBase + taxAmount, [taxBase, taxAmount]);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "WELCOME10") {
      setCouponDiscountPercent(10);
      toast.success("Coupon WELCOME10 applied! 10% discount.");
    } else if (couponCode.toUpperCase() === "SUPERERP") {
      setCouponDiscountPercent(20);
      toast.success("Coupon SUPERERP applied! 20% discount.");
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  const holdBill = () => {
    if (cart.length === 0) { toast.warning("Cannot hold an empty cart."); return; }
    const newHold = { id: `HOLD-${Date.now().toString().slice(-4)}`, cart, customerId: selectedCustomer, subtotal };
    setHeldBills([...heldBills, newHold]);
    setCart([]);
    toast.success(`Transaction on HOLD. Ticket: ${newHold.id}`);
  };

  const restoreBill = (holdId: string) => {
    const ticket = heldBills.find((h) => h.id === holdId);
    if (ticket) {
      setCart(ticket.cart);
      setSelectedCustomer(ticket.customerId);
      setHeldBills(heldBills.filter((h) => h.id !== holdId));
      toast.success(`Restored cart from hold: ${holdId}`);
    }
  };

  const checkout = () => {
    if (cart.length === 0) { toast.warning("Cart is empty."); return; }
    const customerName = CUSTOMERS.find((c) => c.id === selectedCustomer)?.name || "Walk-in";
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" /> Invoice Generated!
        </span>
        <span className="text-xs">Customer: {customerName}</span>
        <span className="text-xs">Amount: {formatCurrency(grandTotal)} ({paymentMethod.toUpperCase()})</span>
      </div>,
      { duration: 6000 }
    );
    setCart([]);
    setCouponDiscountPercent(0);
    setManualDiscountPercent("");
    setCouponCode("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-purple-600 h-8 w-8" /> POS Billing Terminal
          </h1>
          <p className="text-muted-foreground text-sm">
            High-speed smart billing checkout system with offline database updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/20 border-purple-200">
            Terminal Active • Branch Central
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left – Products */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by SKU, barcode, name..."
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40 p-3 rounded-xl items-center shadow-sm">
            <Barcode className="text-purple-600 h-5 w-5 shrink-0" />
            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 hidden sm:inline">Barcode Scanner:</span>
            <Input
              placeholder="Scan/Type SKU and hit Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="h-8 text-xs border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500 bg-card"
            />
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs text-white">
              Scan
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
            {filteredProducts.map((prod) => (
              <Card
                key={prod.id}
                className="cursor-pointer hover:border-purple-500 transition-all hover:shadow-md bg-card group border border-border flex flex-col justify-between h-36"
                onClick={() => addToCart(prod)}
              >
                <CardContent className="p-3.5 flex flex-col justify-between h-full w-full">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">{prod.sku}</span>
                      <Badge className="bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50 text-[10px] px-1.5 py-0">
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
            ))}
          </div>

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

        {/* Right – Cart & Checkout */}
        <div className="xl:col-span-5">
          <Card className="border-border shadow-md bg-card flex flex-col h-[820px] justify-between">
            <CardHeader className="py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Active Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </CardTitle>
                  <CardDescription className="text-xs">Manage quantities and finalise</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setCart([])}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex gap-2">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-9 border-border bg-muted/30">
                    <SelectValue placeholder="Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMERS.map((cust) => (
                      <SelectItem key={cust.id} value={cust.id}>
                        {cust.name} ({cust.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => toast.success("New customer form.")}>
                  <UserPlus className="h-4 w-4 text-purple-600" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 no-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold">POS Cart is Empty</p>
                  <p className="text-xs opacity-70">Scan barcode or click products to add items</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center p-2.5 rounded-lg border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(item.product.price)} / unit •{" "}
                        <span className="text-purple-600 font-medium">
                          Subtotal: {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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

            {/* Calculations & Checkout */}
            <div className="border-t border-border bg-muted/20 p-4 space-y-3 rounded-b-xl">

              {/* Coupon row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Coupon code (WELCOME10, SUPERERP)..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-8 h-9 text-xs bg-card"
                  />
                </div>
                <Button size="sm" variant="outline" className="h-9 px-3 text-xs" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>

              {/* Manual discount row */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Percent className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Instant discount %  (e.g. 10 = 10% off)"
                    value={manualDiscountPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setManualDiscountPercent("");
                        return;
                      }
                      const num = Math.min(Math.max(Number(val), 0), 100);
                      setManualDiscountPercent(num);
                    }}
                    className="pl-8 h-9 text-xs bg-card"
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

              {/* Invoice breakdown */}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Cart Total:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>

                {couponDiscountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Coupon ({couponDiscountPercent}%):
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

                <div className="flex justify-between">
                  <span>GST / VAT (12%):</span>
                  <span className="font-semibold text-foreground">{formatCurrency(taxAmount)}</span>
                </div>

                <Separator className="my-1 bg-border" />

                <div className="flex justify-between text-base font-extrabold text-purple-700 dark:text-purple-400">
                  <span>Total Payable:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-3 gap-2 py-1">
                {(["cash", "card", "upi"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center p-2.5 border rounded-xl gap-1 text-[11px] font-bold transition-all ${
                      paymentMethod === method
                        ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {method === "cash" && <IndianRupee className="h-4 w-4" />}
                    {method === "card" && <CreditCard className="h-4 w-4" />}
                    {method === "upi" && <Wallet className="h-4 w-4" />}
                    <span>{method === "cash" ? "Cash" : method === "card" ? "Card" : "UPI"}</span>
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1 h-11 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-950/20" onClick={holdBill}>
                  <PauseCircle className="h-4 w-4" /> Hold
                </Button>
                <Button className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white gap-1 h-11 shadow-md shadow-purple-600/20 font-bold" onClick={checkout}>
                  <Receipt className="h-4 w-4" /> Complete Checkout
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}