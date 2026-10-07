"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  Check,
  CreditCard,
  Wallet,
  IndianRupee,
  Building,
  Loader2,
  AlertCircle,
  Receipt,
  Minus,
} from "lucide-react";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import { normalizeToUtcMidnight } from "@/lib/date-utils";
import { getSaleById, updateSale } from "@/actions/sales-action";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { getBranchListForDropdown, BranchDropdownItem } from "@/actions/branch-action";
import { getProductDropdown } from "@/actions/product-actions";
import { toast } from "sonner";

interface InvoiceItemEdit {
  id?: string;
  productId: string;
  product_name: string;
  sku?: string;
  stock?: number;
  quantity: number;
  unitPrice: number;
  purchasePrice?: number;
  discount: number;
  subtotal: number;
  total: number;
}

interface InvoicePaymentEdit {
  amount: number;
  paidOn: Date;
  paymentMethod: string;
  paymentNote?: string;
  dueDate?: Date | null;
}

interface InvoiceEditDialogProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InvoiceEditDialog({
  saleId,
  open,
  onOpenChange,
  onSuccess,
}: InvoiceEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState("");
  const [salesDate, setSalesDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<"Ordered" | "Dispatched" | "Cancelled">("Dispatched");
  const [branchId, setBranchId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [items, setItems] = useState<InvoiceItemEdit[]>([]);
  const [payments, setPayments] = useState<InvoicePaymentEdit[]>([]);

  // Dropdowns
  const [branches, setBranches] = useState<BranchDropdownItem[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);

  // Product Search
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Fetch reference dropdowns
  useEffect(() => {
    if (open) {
      void Promise.all([
        getBranchListForDropdown(),
        getCustomerListForDropdown(),
      ]).then(([branchList, custList]) => {
        setBranches(branchList || []);
        setCustomers(custList || []);
      });
    }
  }, [open]);

  // Load sale by ID when dialog opens
  useEffect(() => {
    if (open && saleId) {
      setIsLoading(true);
      getSaleById({ id: saleId })
        .then((res) => {
          const sale = res?.data?.data;
          if (sale) {
            setInvoiceNo(sale.invoiceNo ?? "");
            setSalesDate(
              sale.salesDate
                ? new Date(sale.salesDate)
                : sale.salesdate
                ? new Date(sale.salesdate)
                : new Date()
            );
            setStatus(
              (sale.status as "Ordered" | "Dispatched" | "Cancelled") || "Dispatched"
            );
            setBranchId(sale.branchId ?? sale.branch?.id ?? "");
            setCustomerId(sale.customerId ?? sale.customer?.id ?? "");
            setCustomerName(sale.customer?.name ?? "");

            // Items
            const mappedItems: InvoiceItemEdit[] = (sale.items ?? []).map((item: any) => {
              const qty = Number(item.quantity) || 1;
              const unitPrice = Number(item.unitPrice) || 0;
              const discount = Number(item.discount) || 0;
              const subtotal = qty * unitPrice;
              const total = subtotal - discount;

              return {
                id: item.id,
                productId: item.productId,
                product_name:
                  item.product?.productName ??
                  item.product?.product_name ??
                  item.product_name ??
                  "Item",
                sku: item.product?.sku ?? item.sku ?? "",
                stock: (item.product?.stock ?? 0) + (sale.status === "Dispatched" ? qty : 0),
                quantity: qty,
                unitPrice,
                purchasePrice: Number(item.purchasePrice) || 0,
                discount,
                subtotal,
                total,
              };
            });
            setItems(mappedItems);

            // Payments
            const mappedPayments: InvoicePaymentEdit[] =
              sale.payments && sale.payments.length > 0
                ? sale.payments.map((p: any) => ({
                    amount: Number(p.amount) || 0,
                    paidOn: p.paidOn ? new Date(p.paidOn) : new Date(),
                    paymentMethod: (p.paymentMethod ?? "cash").toLowerCase(),
                    paymentNote: p.paymentNote ?? "",
                    dueDate: p.dueDate ? new Date(p.dueDate) : null,
                  }))
                : [
                    {
                      amount: Number(sale.grandTotal) || 0,
                      paidOn: new Date(),
                      paymentMethod: "cash",
                      paymentNote: "",
                      dueDate: null,
                    },
                  ];
            setPayments(mappedPayments);
          } else {
            toast.error("Failed to load invoice details.");
            onOpenChange(false);
          }
        })
        .catch(() => {
          toast.error("Error loading invoice data.");
          onOpenChange(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, saleId, onOpenChange]);

  // Debounced product search
  useEffect(() => {
    if (!productSearch.trim() || productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingProduct(true);
      try {
        const results = await getProductDropdown({
          query: productSearch.trim(),
          branchId: branchId || undefined,
        });
        setProductResults(Array.isArray(results) ? results : []);
      } catch {
        setProductResults([]);
      } finally {
        setIsSearchingProduct(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch, branchId]);

  // Dynamic calculations
  const grossSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalItemDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const dueAmount = Math.max(0, grandTotal - totalPaid);
  const changeAmount = Math.max(0, totalPaid - grandTotal);

  // Item modifications
  const handleItemQtyChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const subtotal = qty * item.unitPrice;
        const total = Math.max(0, subtotal - item.discount);
        return { ...item, quantity: qty, subtotal, total };
      })
    );
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const subtotal = item.quantity * price;
        const total = Math.max(0, subtotal - item.discount);
        return { ...item, unitPrice: price, subtotal, total };
      })
    );
  };

  const handleItemDiscountChange = (index: number, newDiscount: number) => {
    const discount = Math.max(0, newDiscount);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const subtotal = item.quantity * item.unitPrice;
        const total = Math.max(0, subtotal - discount);
        return { ...item, discount, total };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = (product: any) => {
    // Check if already in items
    const existingIndex = items.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      handleItemQtyChange(existingIndex, items[existingIndex].quantity + 1);
      toast.info(`Increased quantity for ${product.product_name || "item"}`);
    } else {
      const price = Number(product.sellingPrice) || Number(product.purchasePrice) || 0;
      const newItem: InvoiceItemEdit = {
        productId: product.id,
        product_name: product.product_name || product.productName || "Product",
        sku: product.sku || "",
        stock: Number(product.stock) || 0,
        quantity: 1,
        unitPrice: price,
        purchasePrice: Number(product.purchasePrice) || 0,
        discount: 0,
        subtotal: price,
        total: price,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success(`Added ${newItem.product_name}`);
    }
    setProductSearch("");
    setProductResults([]);
  };

  // Payment modifications
  const handleAddPaymentRow = () => {
    const remaining = Math.max(0, grandTotal - totalPaid);
    setPayments((prev) => [
      ...prev,
      {
        amount: remaining,
        paidOn: new Date(),
        paymentMethod: "cash",
        paymentNote: "",
        dueDate: null,
      },
    ]);
  };

  const handleRemovePaymentRow = (index: number) => {
    if (payments.length <= 1) {
      toast.error("At least one payment row is required.");
      return;
    }
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaymentChange = (
    index: number,
    field: keyof InvoicePaymentEdit,
    value: any
  ) => {
    setPayments((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        return { ...p, [field]: value };
      })
    );
  };

  const handleAutoFillPayment = (index: number) => {
    const otherPayments = payments.reduce(
      (sum, p, i) => (i === index ? sum : sum + (p.amount || 0)),
      0
    );
    const needed = Math.max(0, grandTotal - otherPayments);
    handlePaymentChange(index, "amount", needed);
  };

  // Submit Handler
  const handleSaveInvoice = async () => {
    if (!saleId) return;
    if (items.length === 0) {
      toast.error("Invoice must contain at least one item.");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (!branchId) {
      toast.error("Please select a branch.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: saleId,
        invoiceNo,
        branchId,
        customerId,
        status,
        salesdate: normalizeToUtcMidnight(salesDate),
        grandTotal,
        paidAmount: totalPaid,
        dueAmount,
        items: items.map((item) => ({
          productId: item.productId,
          product_name: item.product_name,
          stock: item.stock,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          purchasePrice: Number(item.purchasePrice || 0),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal),
          total: Number(item.total),
        })),
        salesPayment: payments.map((p) => ({
          amount: Number(p.amount) || 0,
          paidOn: p.paidOn ? normalizeToUtcMidnight(p.paidOn) : normalizeToUtcMidnight(new Date()),
          paymentMethod: p.paymentMethod || "cash",
          paymentNote: p.paymentNote || "",
          dueDate: p.dueDate ? normalizeToUtcMidnight(p.dueDate) : undefined,
        })),
      };

      const res = await updateSale(payload as any);
      if (res?.data?.data && !res.data.error) {
        toast.success(`Invoice ${invoiceNo} updated successfully!`);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        const errMsg =
          res?.data?.error ||
          res?.serverError ||
          (res?.validationErrors ? Object.values(res.validationErrors).flat().join(", ") : null) ||
          "Failed to update invoice.";
        toast.error(errMsg);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Edit Invoice
                </DialogTitle>
                {invoiceNo && (
                  <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                    {invoiceNo}
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs capitalize font-medium",
                    status === "Dispatched" && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
                    status === "Ordered" && "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                    status === "Cancelled" && "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  )}
                >
                  {status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update line items, prices, discounts, customer information, and payment methods dynamically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Loading invoice details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Row 1: Invoice Meta Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-card shadow-xs">
              {/* Customer */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Customer</Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-9 text-xs font-normal"
                    >
                      <span className="truncate">
                        {customers.find((c) => c.id === customerId)?.name ||
                          customerName ||
                          "Select customer..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search customer..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-xs p-2">No customer found.</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-y-auto">
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.phone}`}
                              onSelect={() => {
                                setCustomerId(c.id);
                                setCustomerName(c.name);
                                setCustomerOpen(false);
                              }}
                              className="text-xs flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium">{c.name}</p>
                                {c.phone && <p className="text-[10px] text-muted-foreground">{c.phone}</p>}
                              </div>
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5 text-purple-600",
                                  customerId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-9 text-xs font-normal"
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {salesDate ? formatDate(salesDate) : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={salesDate}
                      onSelect={(d) => d && setSalesDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Row 2: Product Search & Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  Invoice Items ({items.length})
                </Label>
                <span className="text-xs text-muted-foreground">
                  Subtotal: <strong className="text-foreground">{formatCurrency(grossSubtotal)}</strong>
                </span>
              </div>

              {/* Product Search Bar */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product by name or SKU to add to invoice..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                  {isSearchingProduct && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {productResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddProduct(p)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {p.product_name || p.productName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            SKU: {p.sku || "N/A"} • Stock: {p.stock ?? 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">
                            {formatCurrency(p.sellingPrice || p.purchasePrice || 0)}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                            <Plus className="h-3 w-3" /> Add item
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border rounded-xl overflow-hidden bg-card shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium">Item & Details</th>
                        <th className="px-3 py-2.5 text-center font-medium w-28">Quantity</th>
                        <th className="px-3 py-2.5 text-right font-medium w-28">Rate (₹)</th>
                        <th className="px-3 py-2.5 text-right font-medium w-24">Disc (₹)</th>
                        <th className="px-3 py-2.5 text-right font-medium w-28">Total (₹)</th>
                        <th className="px-2 py-2.5 text-center font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-30" />
                            No items in this invoice. Search and add products above.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={item.id || item.productId || idx} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2">
                              <p className="font-semibold text-foreground text-xs">{item.product_name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                {item.sku && <span>SKU: {item.sku}</span>}
                                {item.stock !== undefined && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-dashed">
                                    Stock: {item.stock}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            {/* Quantity Stepper */}
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 rounded-md"
                                  onClick={() => handleItemQtyChange(idx, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                                  className="h-7 w-12 text-center text-xs p-1 font-semibold"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 rounded-md"
                                  onClick={() => handleItemQtyChange(idx, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            {/* Unit Price */}
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={item.unitPrice}
                                onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                                className="h-7 w-24 text-right text-xs p-1 font-mono inline-block"
                              />
                            </td>
                            {/* Discount */}
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={item.discount}
                                onChange={(e) => handleItemDiscountChange(idx, Number(e.target.value))}
                                className="h-7 w-20 text-right text-xs p-1 font-mono inline-block"
                              />
                            </td>
                            {/* Line Total */}
                            <td className="px-3 py-2 text-right font-bold text-foreground font-mono">
                              {formatCurrency(item.total)}
                            </td>
                            {/* Remove button */}
                            <td className="px-2 py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 3: Payments Breakdown & Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Payment details (Left 7 cols) */}
              <div className="md:col-span-7 space-y-3 p-4 rounded-xl border bg-card shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    Payments & Settlement
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPaymentRow}
                    className="h-7 text-xs gap-1 border-dashed"
                  >
                    <Plus className="h-3 w-3" /> Add Payment Split
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {payments.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-lg border bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        {/* Method */}
                        <Select
                          value={p.paymentMethod}
                          onValueChange={(val) => handlePaymentChange(pIdx, "paymentMethod", val)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash" className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <IndianRupee className="h-3.5 w-3.5 text-green-600" /> Cash
                              </div>
                            </SelectItem>
                            <SelectItem value="card" className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Card
                              </div>
                            </SelectItem>
                            <SelectItem value="upi" className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-purple-600" /> UPI
                              </div>
                            </SelectItem>
                            <SelectItem value="bank" className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-amber-600" /> Bank
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Amount */}
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={p.amount}
                            onChange={(e) =>
                              handlePaymentChange(pIdx, "amount", Number(e.target.value))
                            }
                            className="h-8 text-xs font-mono font-semibold"
                            placeholder="Amount"
                          />
                        </div>

                        {/* Quick fill full amount */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAutoFillPayment(pIdx)}
                          className="h-8 text-[11px] px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="Auto-fill balance"
                        >
                          Fill Due
                        </Button>

                        {payments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePaymentRow(pIdx)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Note & Date */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Payment note / Txn Ref (optional)..."
                          value={p.paymentNote || ""}
                          onChange={(e) =>
                            handlePaymentChange(pIdx, "paymentNote", e.target.value)
                          }
                          className="h-7 text-[11px] flex-1 bg-background"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card (Right 5 cols) */}
              <div className="md:col-span-5 p-4 rounded-xl border bg-muted/30 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Invoice Summary
                  </Label>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal</span>
                      <span className="font-mono">{formatCurrency(grossSubtotal)}</span>
                    </div>
                    {totalItemDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Total Discounts</span>
                        <span className="font-mono">-{formatCurrency(totalItemDiscount)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t flex justify-between items-baseline">
                      <span className="font-bold text-sm text-foreground">Grand Total</span>
                      <span className="font-bold text-base text-purple-600 font-mono">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settlement overview */}
                <div className="p-3 rounded-lg bg-background border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid:</span>
                    <span className="font-semibold font-mono text-foreground">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  {dueAmount > 0 ? (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Payment Due:</span>
                      <span className="font-mono">{formatCurrency(dueAmount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Payment Status:</span>
                      <span>Paid in Full</span>
                    </div>
                  )}
                  {changeAmount > 0 && (
                    <div className="flex justify-between text-blue-600 font-semibold pt-1 border-t">
                      <span>Change to Return:</span>
                      <span className="font-mono">{formatCurrency(changeAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSaveInvoice}
              disabled={isSaving || isLoading || items.length === 0}
              className="h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Update Invoice
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
