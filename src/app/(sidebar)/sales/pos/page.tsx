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
  DollarSign, 
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

// Mock products database for POS terminal
const POS_PRODUCTS = [
  { id: "p1", name: "Premium Wireless Headphones", sku: "SKU-HPH-01", price: 149.99, stock: 45, category: "Electronics" },
  { id: "p2", name: "Ergonomic Office Chair", sku: "SKU-CHR-02", price: 299.00, stock: 12, category: "Furniture" },
  { id: "p3", name: "Mechanical Gaming Keyboard", sku: "SKU-KBD-03", price: 89.50, stock: 30, category: "Electronics" },
  { id: "p4", name: "Stainless Steel Water Bottle", sku: "SKU-BTL-04", price: 24.99, stock: 120, category: "Home & Kitchen" },
  { id: "p5", name: "Activewear Smart Watch", sku: "SKU-WCH-05", price: 199.99, stock: 22, category: "Electronics" },
  { id: "p6", name: "Organic Arabica Coffee Beans (1kg)", sku: "SKU-CFB-06", price: 18.50, stock: 85, category: "Food & Beverage" },
  { id: "p7", name: "Bamboo Desk Organizer", sku: "SKU-ORG-07", price: 34.99, stock: 50, category: "Office Supplies" },
  { id: "p8", name: "USB-C Multi-port Adapter", sku: "SKU-ADP-08", price: 45.00, stock: 65, category: "Electronics" },
];

const CUSTOMERS = [
  { id: "c1", name: "Walk-in Customer", email: "walkin@erp.com", type: "Retail" },
  { id: "c2", name: "Sarah Jenkins", email: "sarah@gmail.com", type: "VIP" },
  { id: "c3", name: "Michael Vance", email: "mvance@corporate.com", type: "Wholesale" },
  { id: "c4", name: "Elena Rostova", email: "elena@design.org", type: "Retail" },
];

interface CartItem {
  product: typeof POS_PRODUCTS[0];
  quantity: number;
}

export default function PosBillingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("c1");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [heldBills, setHeldBills] = useState<Array<{ id: string; cart: CartItem[]; customerId: string; subtotal: number }>>([]);

  // Categories extraction
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(POS_PRODUCTS.map((p) => p.category)))];
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return POS_PRODUCTS.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Cart operations
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

  // Barcode enter handler
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

  // Pricing calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const taxAmount = useMemo(() => {
    // 12% standard GST/VAT tax on net items
    return ((subtotal - discountAmount) * 12) / 100;
  }, [subtotal, discountAmount]);

  const grandTotal = useMemo(() => {
    return subtotal - discountAmount + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

  // Apply Coupon
  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "WELCOME10") {
      setDiscountPercent(10);
      toast.success("Coupon code WELCOME10 applied! 10% discount credited.");
    } else if (couponCode.toUpperCase() === "SUPERERP") {
      setDiscountPercent(20);
      toast.success("Coupon code SUPERERP applied! 20% discount credited.");
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  // Hold current invoice
  const holdBill = () => {
    if (cart.length === 0) {
      toast.warning("Cannot hold an empty cart.");
      return;
    }
    const newHold = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      cart,
      customerId: selectedCustomer,
      subtotal,
    };
    setHeldBills([...heldBills, newHold]);
    setCart([]);
    toast.success(`Transaction put on HOLD successfully. Ticket: ${newHold.id}`);
  };

  // Restore held bill
  const restoreBill = (holdId: string) => {
    const ticket = heldBills.find((h) => h.id === holdId);
    if (ticket) {
      setCart(ticket.cart);
      setSelectedCustomer(ticket.customerId);
      setHeldBills(heldBills.filter((h) => h.id !== holdId));
      toast.success(`Restored active cart from hold: ${holdId}`);
    }
  };

  // Checkout submission
  const checkout = () => {
    if (cart.length === 0) {
      toast.warning("Cart is empty. Add products to generate invoice.");
      return;
    }
    const customerName = CUSTOMERS.find((c) => c.id === selectedCustomer)?.name || "Walk-in";
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" /> Invoice Generated Successfully!
        </span>
        <span className="text-xs">Customer: {customerName}</span>
        <span className="text-xs">Amount Paid: {formatCurrency(grandTotal)} ({paymentMethod.toUpperCase()})</span>
      </div>,
      { duration: 6000 }
    );
    setCart([]);
    setDiscountPercent(0);
    setCouponCode("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
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
        {/* Left Section - Products Grid (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by SKU, barcode, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-border bg-card shadow-sm"
              />
            </div>

            {/* Category Select */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

          {/* Barcode Quick Entry Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40 p-3 rounded-xl items-center shadow-sm">
            <Barcode className="text-purple-600 h-5 w-5 shrink-0" />
            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 hidden sm:inline">Barcode Scanner Input:</span>
            <Input
              placeholder="Scan/Type SKU barcode and hit Enter... (e.g. SKU-HPH-01)"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="h-8 text-xs border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500 bg-card"
            />
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs text-white">
              Scan
            </Button>
          </form>

          {/* Products List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
            {filteredProducts.map((prod) => (
              <Card 
                key={prod.id} 
                className="cursor-pointer hover:border-purple-500 transition-all hover:shadow-md bg-card overflow-hidden group border border-border"
                onClick={() => addToCart(prod)}
              >
                <div className="bg-muted h-28 flex items-center justify-center relative">
                  <span className="text-4xl group-hover:scale-110 transition-transform">
                    {prod.category === "Electronics" ? "🔌" : prod.category === "Furniture" ? "🪑" : prod.category === "Home & Kitchen" ? "🥤" : "☕"}
                  </span>
                  <Badge className="absolute right-2 top-2 bg-black/60 hover:bg-black/60 border-none text-[10px] text-white">
                    Stock: {prod.stock}
                  </Badge>
                </div>
                <CardContent className="p-3 flex flex-col justify-between h-28">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-purple-600 transition-colors">{prod.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{prod.sku}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-base text-purple-600">{formatCurrency(prod.price)}</span>
                    <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-900 border-slate-200">
                      {prod.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Held Bills Board */}
          {heldBills.length > 0 && (
            <Card className="border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 dark:border-yellow-900/30">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-yellow-800 dark:text-yellow-400">
                    <PauseCircle className="h-4 w-4" /> Held Transactions ({heldBills.length})
                  </CardTitle>
                </div>
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
                    <span>{h.id}</span>
                    <span className="text-[10px] opacity-75 font-normal ml-2">({formatCurrency(h.subtotal)})</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Section - Cart & Checkout Summary (5 cols) */}
        <div className="xl:col-span-5">
          <Card className="border-border shadow-md bg-card flex flex-col h-[760px] justify-between">
            <CardHeader className="py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                    Active Terminal Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </CardTitle>
                  <CardDescription className="text-xs">Manage quantities and finalize tax codes</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setCart([])}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Customer Selector Dropdown */}
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
                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 border-border" onClick={() => toast.success("Added new customer form window mock.")}>
                  <UserPlus className="h-4 w-4 text-purple-600" />
                </Button>
              </div>
            </CardHeader>

            {/* Cart Items List */}
            <CardContent className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 no-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold">POS Cart is Empty</p>
                  <p className="text-xs opacity-70">Scan barcode or click products to populate items list</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center p-2.5 rounded-lg border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(item.product.price)} / unit • <span className="text-purple-600 font-medium">Subtotal: {formatCurrency(item.product.price * item.quantity)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quantity Toggles */}
                      <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 font-bold text-xs text-foreground">{item.quantity}</span>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Calculations & Checkout */}
            <div className="border-t border-border bg-muted/20 p-4 space-y-4 rounded-b-xl">
              {/* Discount / Coupon Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Enter Coupon (supererp, welcome10)..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-8 h-9 text-xs bg-card"
                  />
                </div>
                <Button size="sm" variant="outline" className="h-9 px-3 text-xs" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>

              {/* Invoices Breakdown */}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Cart Items Subtotal:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Discounts Applied ({discountPercent}%):
                  </span>
                  <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard VAT/GST Tax (12%):</span>
                  <span className="font-semibold text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
                <Separator className="my-2 bg-border" />
                <div className="flex justify-between text-base font-extrabold text-purple-700 dark:text-purple-400">
                  <span>Total Payable Invoice:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="grid grid-cols-3 gap-2 py-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-col items-center p-2.5 border rounded-xl gap-1 text-[11px] font-bold transition-all ${
                    paymentMethod === "cash"
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Cash Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center p-2.5 border rounded-xl gap-1 text-[11px] font-bold transition-all ${
                    paymentMethod === "card"
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Card Swipe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`flex flex-col items-center p-2.5 border rounded-xl gap-1 text-[11px] font-bold transition-all ${
                    paymentMethod === "upi"
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  <span>UPI Wallet</span>
                </button>
              </div>

              {/* Checkout Controls */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-border gap-1 h-11 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-950/20" onClick={holdBill}>
                  <PauseCircle className="h-4 w-4" /> Hold Ticket
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
