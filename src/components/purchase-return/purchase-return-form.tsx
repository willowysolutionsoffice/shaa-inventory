'use client';

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { getBrandListForDropdown, getSubBrandsByBrand } from "@/actions/brand-actions";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { fullPurchaseReturnSchema } from "@/schemas/purchase-return-item-schema";
import { createPurchaseReturn, updatePurchaseReturn, getPurchaseReturnList } from "@/actions/purchase-return-action";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { getProductDropdown } from "@/actions/product-actions";
import { getPurchaseList } from "@/actions/purchase-actions";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card } from "../ui/card";
import { Check, ChevronsUpDown, Search, PackageSearch } from "lucide-react";
import { z } from "zod";
import { ProductOption } from "@/types/product";
import { PurchaseReturnFormProps, PurchaseReturnItemField } from "@/types/purchase-return";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn, CURRENCY_SYMBOL, formatDate } from "@/lib/utils";
import { nanoid } from "nanoid";
import { getBranchListForDropdown } from "@/actions/branch-action";

export const PurchaseReturnFormSheet = ({
  purchaseReturn,
  open,
  openChange,
}: PurchaseReturnFormProps) => {
  const isControlled = typeof open === "boolean";
  const { execute: create, isExecuting: isCreating } = useAction(createPurchaseReturn);
  const { execute: update, isExecuting: isUpdating } = useAction(updatePurchaseReturn);

  const [supplierList, setSupplierList] = useState<{ name: string; id: string }[]>([]);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);

  const [branchList, setBranchList] = useState<{ name: string; id: string }[]>([]);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);

  // Purchase picker — needed because backend requires purchaseId
  const [purchaseList, setPurchaseList] = useState<{ id: string; purchaseNo: string; supplierId: string }[]>([]);
  const [showPurchaseSuggestions, setShowPurchaseSuggestions] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [brandId, setBrandId] = useState("");
  const [subBrandId, setSubBrandId] = useState("");
  const [brandList, setBrandList] = useState<{ id: string; name: string }[]>([]);
  const [subBrandList, setSubBrandList] = useState<{ id: string; name: string }[]>([]);

  // Browse-products modal — lists products for the current brand/sub-brand filter
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseProducts, setBrowseProducts] = useState<ProductOption[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  const itemFieldKeys: PurchaseReturnItemField[] = [
    "quantity",
    "unitPrice",
    "subtotal",
    "total",
  ];

  useEffect(() => {
    const fetchDropdowns = async () => {
      const [suppliers, branches, purchasesData, brands] = await Promise.all([
        getSupplierListForDropdown(),
        getBranchListForDropdown(),
        getPurchaseList({ page: 1, limit: 1000 }),
        getBrandListForDropdown(),
      ]);
      setBrandList(brands);
      setSupplierList(suppliers);
      setBranchList(branches);

      // purchasesData is the action result
      const purchases = (purchasesData?.data?.purchases ?? []).map((p: any) => ({
        id:         p.id,
        purchaseNo: p.purchaseNo ?? p.referenceNo ?? '',
        supplierId: p.supplierId ?? '',
      }));
      setPurchaseList(purchases);
    };
    fetchDropdowns();
  }, []);

  // reload sub-brands when brand changes, clear stale selection
  useEffect(() => {
    if (!brandId) { setSubBrandList([]); setSubBrandId(""); return; }
    getSubBrandsByBrand(brandId).then(setSubBrandList).catch(() => setSubBrandList([]));
    setSubBrandId("");
  }, [brandId]);

  // quick-search popover — debounced, filtered by brand/sub-brand
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const products = await getProductDropdown({
  query: productSearch,
  ...(brandId ? { brandId } : {}),
  ...(subBrandId ? { subBrandId } : {}),
});
        setProductOptions(applyProductFilters(products ?? []));
      } else {
        setProductOptions([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch, brandId, subBrandId]);

  // browse modal — loads product list for brand/sub-brand (with optional in-modal search)
  useEffect(() => {
    if (!browseOpen) return;

    let cancelled = false;
    setBrowseLoading(true);

    const debounce = setTimeout(async () => {
      const products = await getProductDropdown({
  query: browseSearch || "",
  ...(brandId ? { brandId } : {}),
  ...(subBrandId ? { subBrandId } : {}),
});
      if (!cancelled) {
        setBrowseProducts(applyProductFilters(products ?? []));
        setBrowseLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [browseOpen, browseSearch, brandId, subBrandId]);

  // reset in-modal search each time it's opened fresh
  useEffect(() => {
    if (browseOpen) setBrowseSearch("");
  }, [browseOpen]);

  const form = useForm<z.infer<typeof fullPurchaseReturnSchema>>({
    resolver: zodResolver(fullPurchaseReturnSchema),
    defaultValues: {
      referenceNo:        `RET-${nanoid(4).toUpperCase()}`,
      purchaseId:         purchaseReturn?.purchaseId        || "",
      branchId:           purchaseReturn?.branchId          || "",
      supplierId:         purchaseReturn?.supplierId         || "",
      returnDate:         purchaseReturn?.returnDate
                            ? new Date(purchaseReturn.returnDate)
                            : new Date(),
      totalAmount:        purchaseReturn?.totalAmount        || 0,
      purchaseReturnItem: purchaseReturn?.purchaseReturnItem || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "purchaseReturnItem",
  });

  // When editing, reset to existing data
  useEffect(() => {
    if (purchaseReturn) {
      form.reset({
        purchaseId:         purchaseReturn.purchaseId        || "",
        branchId:           purchaseReturn.branchId          || "",
        supplierId:         purchaseReturn.supplierId         || "",
        returnDate:         purchaseReturn.returnDate
                              ? new Date(purchaseReturn.returnDate)
                              : new Date(),
        totalAmount:        purchaseReturn.totalAmount        || 0,
        purchaseReturnItem: purchaseReturn.purchaseReturnItem || [],
      });
    }
  }, [form, purchaseReturn]);

  const addProduct = (p: ProductOption) => {
    append({
      productId:    p.id,
      product_name: p.product_name,
      quantity:     1,
      unitPrice:    p.purchasePrice,
      subtotal:     p.purchasePrice,
      total:        p.purchasePrice,
    });
  };

  const isProductAdded = (id: string) =>
    fields.some((f: any) => f.productId === id);

  // Safety filter for Browse Products and quick search.
  // Backend may return all products even when brand/sub-brand params are sent,
  // so we also filter on the client using all possible product field shapes.
  const getProductBrandId = (p: any) =>
    p.brandId ?? p.brand_id ?? p.brand?.id ?? "";

  const getProductSubBrandId = (p: any) =>
    p.subBrandId ?? p.sub_brand_id ?? p.subBrand?.id ?? "";

  const applyProductFilters = (products: ProductOption[]) => {
    return products.filter((p: any) => {
      const matchesBrand = !brandId || getProductBrandId(p) === brandId;
      const matchesSubBrand =
        !subBrandId || getProductSubBrandId(p) === subBrandId;

      return matchesBrand && matchesSubBrand;
    });
  };

  const handleSubmit = async (data: z.infer<typeof fullPurchaseReturnSchema>) => {
    if (!data.purchaseId) {
      toast.error("Please select a purchase");
      return;
    }

    const totalAmount = data.purchaseReturnItem.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    form.setValue("totalAmount", totalAmount);

    const payload = { ...data, totalAmount };

    if (purchaseReturn) {
      await update({ id: purchaseReturn.id, ...payload });
      toast.success("Purchase return updated successfully");
    } else {
      await create(payload);
      toast.success("Purchase return created successfully");
      form.reset();
    }

    if (openChange) openChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button>New Purchase Return</Button>
        </SheetTrigger>
      )}
      <SheetContent side="top" className="max-h-screen overflow-y-auto p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <SheetHeader>
              <SheetTitle>
                {purchaseReturn ? "Edit Purchase Return" : "New Purchase Return"}
              </SheetTitle>
            </SheetHeader>

            <Card className="grid md:grid-cols-2 gap-4 p-4">
              {/* Purchase selector — required by backend */}
              <FormField
                control={form.control}
                name="purchaseId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Purchase <span className="text-destructive">*</span></FormLabel>
                    <Popover
                      open={showPurchaseSuggestions}
                      onOpenChange={setShowPurchaseSuggestions}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {purchaseList.find((p) => p.id === field.value)?.purchaseNo ||
                            "Select purchase..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search purchase no..." />
                          <CommandList>
                            <CommandEmpty>No purchases found.</CommandEmpty>
                            <CommandGroup>
                              {purchaseList.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.purchaseNo}
                                  onSelect={() => {
                                    field.onChange(p.id);
                                    // auto-fill supplier from the selected purchase
                                    if (p.supplierId) {
                                      form.setValue("supplierId", p.supplierId);
                                    }
                                    setShowPurchaseSuggestions(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      p.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {p.purchaseNo}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supplier */}
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Supplier</FormLabel>
                    <Popover
                      open={showSupplierSuggestions}
                      onOpenChange={setShowSupplierSuggestions}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {supplierList.find((s) => s.id === field.value)?.name ||
                            "Select supplier..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search supplier..." />
                          <CommandList>
                            <CommandEmpty>No supplier found.</CommandEmpty>
                            <CommandGroup>
                              {supplierList.map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={supplier.name}
                                  onSelect={() => {
                                    field.onChange(supplier.id);
                                    setShowSupplierSuggestions(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      supplier.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {supplier.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch */}
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Business Location</FormLabel>
                    <Popover
                      open={showBranchSuggestions}
                      onOpenChange={setShowBranchSuggestions}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {branchList.find((b) => b.id === field.value)?.name ||
                            "Select Branch..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search branch..." />
                          <CommandList>
                            <CommandEmpty>No branch found.</CommandEmpty>
                            <CommandGroup>
                              {branchList.map((branch) => (
                                <CommandItem
                                  key={branch.id}
                                  value={branch.name}
                                  onSelect={() => {
                                    field.onChange(branch.id);
                                    setShowBranchSuggestions(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      branch.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {branch.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Return Date */}
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full text-left">
                            {field.value ? formatDate(field.value) : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          onSelect={field.onChange}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            {/* Products */}
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Brand
                  </span>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]"
                  >
                    <option value="">All Brands</option>
                    {brandList.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sub-brand
                  </span>
                  <select
                    value={subBrandId}
                    onChange={(e) => setSubBrandId(e.target.value)}
                    disabled={!brandId}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px] disabled:opacity-50"
                  >
                    <option value="">{brandId ? "All Sub-brands" : "Select brand first"}</option>
                    {subBrandList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <FormItem className="relative flex-1 min-w-[220px]">
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Add Product
                  </FormLabel>
                  <Popover
                    open={productOptions.length > 0}
                    onOpenChange={() => setProductOptions([])}
                  >
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search product…"
                          className="h-9 pl-9"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search product..."
                          value={productSearch}
                          onValueChange={setProductSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No products found.</CommandEmpty>
                          <CommandGroup>
                            {productOptions.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.product_name}
                                onSelect={() => {
                                  addProduct(p);
                                  setProductSearch("");
                                  setProductOptions([]);
                                }}
                              >
                                {p.product_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormItem>

                {/* Browse Products modal trigger */}
                <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="h-9 gap-2">
                      <PackageSearch className="h-4 w-4" />
                      Browse Products
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {brandId
                          ? `Products${subBrandId ? "" : " — " + (brandList.find(b => b.id === brandId)?.name ?? "")}${
                              subBrandId ? " — " + (subBrandList.find(s => s.id === subBrandId)?.name ?? "") : ""
                            }`
                          : "All Products"}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search within this list…"
                          className="pl-9"
                          value={browseSearch}
                          onChange={(e) => setBrowseSearch(e.target.value)}
                        />
                      </div>

                      <div className="max-h-[420px] overflow-y-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="w-28">Stock</TableHead>
                              <TableHead className="w-28">Cost</TableHead>
                              <TableHead className="w-24" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {browseLoading ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                  Loading products…
                                </TableCell>
                              </TableRow>
                            ) : browseProducts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                  No products found for this filter.
                                </TableCell>
                              </TableRow>
                            ) : (
                              browseProducts.map((p) => {
                                const added = isProductAdded(p.id);
                                return (
                                  <TableRow key={p.id}>
                                    <TableCell>{p.product_name}</TableCell>
                                    <TableCell>{p.stock ?? "—"}</TableCell>
                                    <TableCell>
                                      {CURRENCY_SYMBOL} {Number(p.purchasePrice ?? 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={added ? "secondary" : "default"}
                                        disabled={added}
                                        onClick={() => addProduct(p)}
                                      >
                                        {added ? "Added" : "Add"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setBrowseOpen(false)}>
                        Done
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
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
                            name={`purchaseReturnItem.${idx}.${key}`}
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  readOnly={key === "total"}
                                  tabIndex={key === "total" ? -1 : 0}
                                  value={
                                    field.value === undefined ||
                                    field.value === null ||
                                    Number.isNaN(field.value)
                                      ? ""
                                      : field.value
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);

                                    if (key === "quantity" || key === "unitPrice") {
                                      const qty =
                                        key === "quantity"
                                          ? Number(val)
                                          : Number(
                                              form.getValues(
                                                `purchaseReturnItem.${idx}.quantity`
                                              )
                                            );
                                      const unitPrice =
                                        key === "unitPrice"
                                          ? Number(val)
                                          : Number(
                                              form.getValues(
                                                `purchaseReturnItem.${idx}.unitPrice`
                                              )
                                            );
                                      const subtotal = qty * unitPrice;
                                      form.setValue(
                                        `purchaseReturnItem.${idx}.subtotal`,
                                        subtotal
                                      );
                                      form.setValue(
                                        `purchaseReturnItem.${idx}.total`,
                                        subtotal
                                      );
                                    } else if (key === "subtotal") {
                                      form.setValue(
                                        `purchaseReturnItem.${idx}.total`,
                                        Number(val)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                            )}
                          />
                        </TableCell>
                      ))}

                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => remove(idx)}
                        >
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
                    {form
                      .watch("purchaseReturnItem")
                      .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>

            <SheetFooter>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? "Saving..." : "Save"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};