"use client";

import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Search, Plus, Loader2 } from "lucide-react";

import { createSalesReturn, updateSalesReturn } from "@/actions/sales-return-action";
import { getProductDropdown } from "@/actions/product-actions";
import { getSalesList, getSaleById } from "@/actions/sales-action";

import { Card } from "../ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { SalesReturnFormProps } from "@/types/sales-return";
import { ProductOption } from "@/types/product";
import { cn, CURRENCY_SYMBOL } from "@/lib/utils";

interface ReturnLineForm {
  productId: string;
  product_name: string;
  sku?: string;
  soldQty: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
}

interface ExchangeLineForm {
  productId: string;
  product_name: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  subtotal: number;
  total: number;
}

interface FormValues {
  saleId: string;
  refundMethod: "original" | "cash" | "credit";
  reason: string;
  items: ReturnLineForm[];
  exchangeItems: ExchangeLineForm[];
  extraPaymentMethod: "cash" | "card" | "upi";
}

const money = (value: number) => `${CURRENCY_SYMBOL} ${Number(value || 0).toFixed(2)}`;

function normalizeSaleFromAction(res: any) {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (payload?.error) throw new Error(payload.error);
  return payload;
}

export const SalesReturnFormSheet = ({ salesReturn, open, openChange }: SalesReturnFormProps) => {
  const isControlled = typeof open === "boolean";
  const isEdit = !!salesReturn;

  const { execute: create, isExecuting: isCreating } = useAction(createSalesReturn, {
    onSuccess: () => { toast.success("Sales return / exchange saved"); openChange?.(false); },
    onError: ({ error }) => toast.error(error?.serverError ?? "Failed to create sales return"),
  });

  const { execute: update, isExecuting: isUpdating } = useAction(updateSalesReturn, {
    onSuccess: () => { toast.success("Sales return updated"); openChange?.(false); },
    onError: ({ error }) => toast.error(error?.serverError ?? "Failed to update sales return"),
  });

  const [saleSearch, setSaleSearch] = useState("");
  const [saleOptions, setSaleOptions] = useState<{ id: string; invoiceNo: string }[]>([]);
  const [showSales, setShowSales] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesLoaded, setSalesLoaded] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productSearchResults, setProductSearchResults] = useState<ProductOption[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productSearching, setProductSearching] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      saleId: salesReturn?.saleId ?? "",
      refundMethod: (salesReturn?.refundMethod as any) ?? "original",
      reason: salesReturn?.reason ?? "",
      items: [],
      exchangeItems: [],
      extraPaymentMethod: "cash",
    },
  });

  const returnItems = useFieldArray({ control: form.control, name: "items" });
  const exchangeItems = useFieldArray({ control: form.control, name: "exchangeItems" });

  const watchedReturnItems = form.watch("items") ?? [];
  const watchedExchangeItems = form.watch("exchangeItems") ?? [];
  const saleId = form.watch("saleId");

  const returnTotal = watchedReturnItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const exchangeTotal = watchedExchangeItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const balanceToCollect = Math.max(0, exchangeTotal - returnTotal);
  const refundOrCredit = Math.max(0, returnTotal - exchangeTotal);

  const loadSales = async () => {
    if (salesLoaded || salesLoading) return;
    setSalesLoading(true);
    try {
      const res = await getSalesList({ page: 1, limit: 100 });
      const all = (res as any)?.data?.sales ?? (res as any)?.sales ?? [];
      setSaleOptions(all.map((s: any) => ({ id: s.id, invoiceNo: s.invoiceNo })));
      setSalesLoaded(true);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadProducts = async () => {
    if (productsLoaded || productsLoading) return;
    setProductsLoading(true);
    try {
      const products = await getProductDropdown({ query: "" });
      setProductOptions(products ?? []);
    } finally {
      setProductsLoaded(true);
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  const loadSelectedSale = async (id: string) => {
    if (!id) return;
    setSelectedSaleLoading(true);
    try {
      const res = await getSaleById({ id });
      const sale = normalizeSaleFromAction(res);
      setSelectedSale(sale);

      const lines: ReturnLineForm[] = (sale.items ?? []).map((item: any) => ({
        productId: item.productId,
        product_name: item.product?.productName ?? item.product?.product_name ?? item.productName ?? "—",
        sku: item.product?.sku ?? "",
        soldQty: Number(item.quantity ?? 0),
        quantity: 0,
        unitPrice: Number(item.unitPrice ?? 0),
        subtotal: 0,
        total: 0,
      }));

      form.setValue("items", lines);
      form.setValue("exchangeItems", []);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load invoice details");
      setSelectedSale(null);
      form.setValue("items", []);
    } finally {
      setSelectedSaleLoading(false);
    }
  };

  useEffect(() => {
    if (saleId && !isEdit) loadSelectedSale(saleId);
  }, [saleId]);

  const filteredSaleOptions = useMemo(() => {
    if (!saleSearch) return saleOptions;
    const q = saleSearch.toLowerCase();
    return saleOptions.filter((s) => s.invoiceNo?.toLowerCase().includes(q));
  }, [saleOptions, saleSearch]);

  useEffect(() => {
    if (!productSearch) {
      setProductSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setProductSearching(true);
      try {
        const products = await getProductDropdown({ query: productSearch });
        setProductSearchResults(products ?? []);
      } finally {
        setProductSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const displayedProductOptions = productSearch ? productSearchResults : productOptions;

  const selectedSaleInvoice = saleOptions.find((s) => s.id === saleId)?.invoiceNo
    ?? selectedSale?.invoiceNo
    ?? salesReturn?.sale?.invoiceNo
    ?? "";

  const updateReturnQty = (idx: number, raw: string) => {
    const soldQty = Number(form.getValues(`items.${idx}.soldQty`) || 0);
    const unitPrice = Number(form.getValues(`items.${idx}.unitPrice`) || 0);
    const qty = Math.min(Math.max(Number(raw || 0), 0), soldQty);
    form.setValue(`items.${idx}.quantity`, qty);
    form.setValue(`items.${idx}.subtotal`, qty * unitPrice);
    form.setValue(`items.${idx}.total`, qty * unitPrice);
  };

  const updateExchangeLine = (idx: number, key: "quantity" | "unitPrice", raw: string) => {
    const value = Math.max(Number(raw || 0), 0);
    form.setValue(`exchangeItems.${idx}.${key}`, value);
    const qty = key === "quantity" ? value : Number(form.getValues(`exchangeItems.${idx}.quantity`) || 0);
    const price = key === "unitPrice" ? value : Number(form.getValues(`exchangeItems.${idx}.unitPrice`) || 0);
    form.setValue(`exchangeItems.${idx}.subtotal`, qty * price);
    form.setValue(`exchangeItems.${idx}.total`, qty * price);
  };

  const handleSubmit = (data: FormValues) => {
    const returnedItems = data.items
      .filter((i) => Number(i.quantity) > 0)
      .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) }));

    const newItems = (data.exchangeItems ?? [])
      .filter((i) => Number(i.quantity) > 0)
      .map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
        purchasePrice: Number(i.purchasePrice ?? 0),
      }));

    if (!data.saleId) {
      toast.error("Select a sale invoice");
      return;
    }
    if (!returnedItems.length) {
      toast.error("Select at least one returned product quantity");
      return;
    }

    const payload = {
      saleId: data.saleId,
      refundMethod: data.refundMethod,
      reason: data.reason || null,
      items: returnedItems,
      exchangeItems: newItems,
      extraPayment: balanceToCollect > 0
        ? {
            amount: balanceToCollect,
            paymentMethod: data.extraPaymentMethod,
            paymentNote: `Exchange balance for ${selectedSaleInvoice}`,
          }
        : null,
    };

    if (isEdit) {
      update({ id: salesReturn.id, ...payload });
    } else {
      create(payload);
    }
  };

  return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button><Plus className="mr-2 h-4 w-4" />New Sales Return</Button>
        </SheetTrigger>
      )}

      <SheetContent side="top" className="max-h-screen overflow-y-auto p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <SheetHeader>
              <SheetTitle>{isEdit ? "Edit Sales Return" : "Sales Return / Exchange"}</SheetTitle>
            </SheetHeader>

            <Card className="grid md:grid-cols-2 gap-4 p-4">
              <FormField
                control={form.control}
                name="saleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Sale Invoice</FormLabel>
                    <Popover
                      open={showSales}
                      onOpenChange={(o) => {
                        setShowSales(o);
                        if (o) loadSales();
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox"
                          className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          disabled={isEdit}
                        >
                          {selectedSaleInvoice || "Select sale..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Search invoice..." value={saleSearch} onValueChange={setSaleSearch} />
                          <CommandList>
                            {salesLoading ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">Loading sales...</div>
                            ) : (
                              <>
                                <CommandEmpty>No sale found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredSaleOptions.map((s) => (
                                    <CommandItem key={s.id} value={s.invoiceNo}
                                      onSelect={() => { field.onChange(s.id); setShowSales(false); }}>
                                      {s.invoiceNo}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refundMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund / Credit Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="original">Original Payment</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Customer Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Reason for return / exchange..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            {selectedSaleLoading && (
              <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading selected invoice details...
              </Card>
            )}

            {selectedSale && (
              <Card className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Selected Invoice: {selectedSale.invoiceNo}</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer: {selectedSale.customer?.name ?? "—"} {selectedSale.customer?.phone ? `• ${selectedSale.customer.phone}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Invoice Total</p>
                    <p className="text-lg font-semibold">{money(Number(selectedSale.grandTotal ?? 0))}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold">Returned Products</h3>
                <p className="text-sm text-muted-foreground">Enter return quantity only for products the customer is returning.</p>
              </div>

              {returnItems.fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Sold Qty</TableHead>
                      <TableHead>Return Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Return Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.fields.map((f, idx) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="font-medium">{f.product_name || "—"}</div>
                          {f.sku && <div className="text-xs text-muted-foreground">SKU: {f.sku}</div>}
                        </TableCell>
                        <TableCell>{form.watch(`items.${idx}.soldQty`)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={form.watch(`items.${idx}.soldQty`)}
                            value={form.watch(`items.${idx}.quantity`) ?? 0}
                            className="w-24"
                            onChange={(e) => updateReturnQty(idx, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>{money(Number(form.watch(`items.${idx}.unitPrice`) ?? 0))}</TableCell>
                        <TableCell className="font-semibold">{money(Number(form.watch(`items.${idx}.total`) ?? 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>Select a sale invoice to show its products.</p>
                </div>
              )}
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-end gap-3 md:justify-between">
                <div>
                  <h3 className="font-semibold">New / Exchange Products</h3>
                  <p className="text-sm text-muted-foreground">Add products the customer is taking instead of the returned product.</p>
                </div>

                <FormItem className="relative w-full md:max-w-sm">
                  <FormLabel>Add New Product</FormLabel>
                  <Popover
                    open={showProducts}
                    onOpenChange={(o) => {
                      setShowProducts(o);
                      if (o) loadProducts();
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Search product…"
                          className="pl-9"
                          value={productSearch}
                          onFocus={() => setShowProducts(true)}
                          onChange={(e) => { setProductSearch(e.target.value); setShowProducts(true); }}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Command shouldFilter={false}>
                        <CommandList>
                          {productsLoading || productSearching ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">Loading products...</div>
                          ) : (
                            <>
                              <CommandEmpty>No products found.</CommandEmpty>
                              <CommandGroup>
                                {displayedProductOptions.map((p: any) => {
                                  const price = Number(p.sellingPrice ?? p.purchasePrice ?? 0);
                                  return (
                                    <CommandItem key={p.id} value={p.product_name ?? p.productName}
                                      onSelect={() => {
                                        exchangeItems.append({
                                          productId: p.id,
                                          product_name: p.product_name ?? p.productName,
                                          quantity: 1,
                                          unitPrice: price,
                                          purchasePrice: Number(p.purchasePrice ?? 0),
                                          subtotal: price,
                                          total: price,
                                        });
                                        setProductSearch("");
                                        setShowProducts(false);
                                      }}>
                                      {p.product_name ?? p.productName} <span className="ml-auto text-xs text-muted-foreground">{money(price)}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormItem>
              </div>

              {exchangeItems.fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeItems.fields.map((f, idx) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.product_name || "—"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={form.watch(`exchangeItems.${idx}.quantity`) ?? 1}
                            className="w-24"
                            onChange={(e) => updateExchangeLine(idx, "quantity", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={form.watch(`exchangeItems.${idx}.unitPrice`) ?? 0}
                            className="w-32"
                            onChange={(e) => updateExchangeLine(idx, "unitPrice", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="font-semibold">{money(Number(form.watch(`exchangeItems.${idx}.total`) ?? 0))}</TableCell>
                        <TableCell>
                          <Button type="button" variant="destructive" onClick={() => exchangeItems.remove(idx)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg text-center">
                  No exchange product added. This will work as a normal sales return.
                </div>
              )}
            </Card>

            <Card className="p-4 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Return Value</p>
                  <p className="text-lg font-semibold text-emerald-600">{money(returnTotal)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">New Product Value</p>
                  <p className="text-lg font-semibold text-purple-600">{money(exchangeTotal)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{balanceToCollect > 0 ? "Balance to Collect" : "Refund / Credit"}</p>
                  <p className={`text-lg font-semibold ${balanceToCollect > 0 ? "text-orange-600" : "text-blue-600"}`}>
                    {money(balanceToCollect > 0 ? balanceToCollect : refundOrCredit)}
                  </p>
                </div>
              </div>

              {balanceToCollect > 0 && (
                <FormField
                  control={form.control}
                  name="extraPaymentMethod"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Balance Payment Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </Card>

            <SheetFooter>
              <Button type="submit" disabled={isCreating || isUpdating || selectedSaleLoading}>
                {isCreating || isUpdating ? "Saving..." : "Submit Return / Exchange"}
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};
