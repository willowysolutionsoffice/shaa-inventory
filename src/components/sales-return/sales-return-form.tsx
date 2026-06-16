"use client";

import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { Search, Plus } from "lucide-react";

import { createSalesReturnSchema, updateSalesReturnSchema } from "@/schemas/sales-return-schema";
import { createSalesReturn, updateSalesReturn } from "@/actions/sales-return-action";
import { getProductDropdown } from "@/actions/product-actions";
import { getSalesList } from "@/actions/sales-action";

import { Card } from "../ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { SalesReturnFormProps, SalesReturnItemField } from "@/types/sales-return";
import { ProductOption } from "@/types/product";
import { cn, CURRENCY_SYMBOL, formatDate } from "@/lib/utils";

type CreateForm = z.infer<typeof createSalesReturnSchema>;
type UpdateForm = z.infer<typeof updateSalesReturnSchema>;

export const SalesReturnFormSheet = ({ salesReturn, open, openChange }: SalesReturnFormProps) => {
  const isControlled = typeof open === "boolean";
  const isEdit       = !!salesReturn;

  const { execute: create, isExecuting: isCreating } = useAction(createSalesReturn, {
    onSuccess: () => { toast.success("Sales return created"); openChange?.(false); },
    onError:   () => toast.error("Failed to create sales return"),
  });

  const { execute: update, isExecuting: isUpdating } = useAction(updateSalesReturn, {
    onSuccess: () => { toast.success("Sales return updated"); openChange?.(false); },
    onError:   () => toast.error("Failed to update sales return"),
  });

  // ----- Sale invoice picker -----
  const [saleSearch,   setSaleSearch]   = useState("");
  const [saleOptions,  setSaleOptions]  = useState<{ id: string; invoiceNo: string }[]>([]);
  const [showSales,    setShowSales]    = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesLoaded,  setSalesLoaded]  = useState(false);

  // ----- Product picker -----
  const [productSearch,       setProductSearch]       = useState("");
  const [productOptions,      setProductOptions]      = useState<ProductOption[]>([]); // full/default list
  const [productSearchResults,setProductSearchResults]= useState<ProductOption[]>([]); // live search-as-you-type
  const [showProducts,        setShowProducts]        = useState(false);
  const [productsLoading,     setProductsLoading]     = useState(false);
  const [productsLoaded,      setProductsLoaded]      = useState(false);
  const [productSearching,    setProductSearching]    = useState(false);

  const itemFieldKeys: SalesReturnItemField[] = ["quantity", "unitPrice", "subtotal", "total"];

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSalesReturnSchema),
    defaultValues: {
      saleId:       salesReturn?.saleId       ?? "",
      refundMethod: (salesReturn?.refundMethod as any) ?? "original",
      reason:       salesReturn?.reason       ?? "",
      items:        salesReturn?.items?.map((i) => ({
        productId:    i.productId,
        product_name: i.product_name,
        quantity:     i.quantity,
        unitPrice:    i.unitPrice,
        subtotal:     i.subtotal,
        total:        i.total,
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  // Load the full sale list once (e.g. when the sale picker is first opened),
  // so every invoice is already visible before the user types anything.
  const loadSales = async () => {
    if (salesLoaded || salesLoading) return;
    setSalesLoading(true);
    try {
      const res = await getSalesList({ page: 1, limit: 100 });
      const all = (res as any)?.data?.sales ?? [];
      setSaleOptions(all.map((s: any) => ({ id: s.id, invoiceNo: s.invoiceNo })));
      setSalesLoaded(true);
    } finally {
      setSalesLoading(false);
    }
  };

  // Load the full/default product list once, so the dropdown is already
  // populated before the user types anything. getProductDropdown returns
  // the array directly (or [] on failure) — not wrapped in { data }.
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

  // Pre-fetch both lists as soon as the sheet mounts/opens, so the dropdowns
  // already have everything in them the moment the user clicks into them.
  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  // Client-side filter over the already-loaded full lists — instant, no
  // network round trip per keystroke.
  const filteredSaleOptions = useMemo(() => {
    if (!saleSearch) return saleOptions;
    const q = saleSearch.toLowerCase();
    return saleOptions.filter((s) => s.invoiceNo?.toLowerCase().includes(q));
  }, [saleOptions, saleSearch]);

  // Live search-as-you-type, narrowing the preloaded list via the server.
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

  // While typing, narrow via live server search results; otherwise show the
  // full preloaded list.
  const displayedProductOptions = productSearch ? productSearchResults : productOptions;

  const handleSubmit = (data: CreateForm) => {
    const payload = {
      ...data,
      items: data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };
    if (isEdit) {
      update({ id: salesReturn.id, ...payload });
    } else {
      create(payload);
    }
  };

  const selectedSaleInvoice = saleOptions.find((s) => s.id === form.watch("saleId"))?.invoiceNo
    ?? (salesReturn?.sale?.invoiceNo ?? "");

  return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button><Plus className="mr-2 h-4 w-4" />New Sales Return</Button>
        </SheetTrigger>
      )}

      <SheetContent side="top" className="max-h-screen overflow-y-auto p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, (e) => console.log("Validation:", e))}
            className="space-y-4">
            <SheetHeader>
              <SheetTitle>{isEdit ? "Edit Sales Return" : "New Sales Return"}</SheetTitle>
            </SheetHeader>

            <Card className="grid md:grid-cols-2 gap-4 p-4">
              {/* Sale picker */}
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
                          className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                          {selectedSaleInvoice || "Select sale..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Search invoice..." value={saleSearch}
                            onValueChange={setSaleSearch} />
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

              {/* Refund method */}
              <FormField
                control={form.control}
                name="refundMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["original", "cash", "credit"].map((m) => (
                          <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Reason for return..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            {/* Items */}
            <Card className="p-4 space-y-4">
              <FormItem className="relative max-w-sm">
                <FormLabel>Add Product</FormLabel>
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
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProducts(true);
                        }}
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
                              {displayedProductOptions.map((p) => (
                                <CommandItem key={p.id} value={p.product_name}
                                  onSelect={() => {
                                    append({
                                      productId:    p.id,
                                      product_name: p.product_name,
                                      quantity:     1,
                                      unitPrice:    p.sellingPrice || p.purchasePrice,
                                      subtotal:     p.sellingPrice || p.purchasePrice,
                                      total:        p.sellingPrice || p.purchasePrice,
                                    });
                                    setProductSearch("");
                                    setShowProducts(false);
                                  }}>
                                  {p.product_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormItem>

              {fields.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((f, idx) => (
                        <TableRow key={f.id}>
                          <TableCell>{f.product_name || "—"}</TableCell>
                          {itemFieldKeys.map((key) => (
                            <TableCell key={key}>
                              <FormField
                                control={form.control}
                                name={`items.${idx}.${key}`}
                                render={({ field }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value ?? ""}
                                      readOnly={key === "subtotal" || key === "total"}
                                      disabled={key === "subtotal" || key === "total"}
                                      className="min-w-20"
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value));
                                        if (key === "quantity" || key === "unitPrice") {
                                          const qty   = key === "quantity"
                                            ? Number(e.target.value)
                                            : Number(form.getValues(`items.${idx}.quantity`));
                                          const price = key === "unitPrice"
                                            ? Number(e.target.value)
                                            : Number(form.getValues(`items.${idx}.unitPrice`));
                                          const sub   = qty * price;
                                          form.setValue(`items.${idx}.subtotal`, sub);
                                          form.setValue(`items.${idx}.total`,    sub);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                )}
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button type="button" variant="destructive" onClick={() => remove(idx)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end pr-4">
                    <div className="text-right space-y-1">
                      <div className="text-muted-foreground text-sm">Total Return:</div>
                      <div className="text-xl font-semibold">
                        {CURRENCY_SYMBOL}{" "}
                        {form.watch("items")
                          .reduce((sum, i) => sum + (Number(i.total) || 0), 0)
                          .toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No products added yet.</p>
                  <p>Search and select products above to add them.</p>
                </div>
              )}
            </Card>

            <SheetFooter>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};