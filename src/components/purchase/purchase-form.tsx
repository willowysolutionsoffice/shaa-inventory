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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { fullPurchaseSchema } from "@/schemas/purchase-item-schema";
import { createPurchase, updatePurchase } from "@/actions/purchase-actions";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { getProductDropdown } from "@/actions/product-actions";
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
import { PurchaseFormProps } from "@/types/purchase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { PurchaseItemField } from "@/types/purchase";
import { z } from "zod";
import { ProductOption } from "@/types/product";
import { cn, CURRENCY_SYMBOL, formatDate } from "@/lib/utils";
import { normalizeToUtcMidnight, getTodayUtcMidnight } from "@/lib/date-utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { nanoid } from "nanoid";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = [
  { value: "cash",   label: "Cash" },
  { value: "card",   label: "Card" },
  { value: "upi",    label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "bank",   label: "Bank Transfer" },
  { value: "other",  label: "Other" },
] as const;

// FIX: only editable fields — subtotal and total are computed, not input
const ITEM_FIELD_KEYS: PurchaseItemField[] = ["quantity", "unitPrice", "discount"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeVal = (v: unknown): number | "" => {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PurchaseFormSheet = ({
  purchase,
  open,
  openChange,
}: PurchaseFormProps) => {
  const isControlled = typeof open === "boolean";

  const { execute: create, isExecuting: isCreating } = useAction(createPurchase);
  const { execute: update, isExecuting: isUpdating } = useAction(updatePurchase);

  const [productSearch,           setProductSearch]           = useState("");
  const [productOptions,          setProductOptions]          = useState<ProductOption[]>([]);
  type SupplierOption = { name: string; id: string; openingBalance: number };

  const [supplierList, setSupplierList] = useState<SupplierOption[]>([]);

  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [branchList,              setBranchList]              = useState<{ name: string; id: string }[]>([]);
  const [showBranchSuggestions,   setShowBranchSuggestions]   = useState(false);
  const [openSupplierForm,        setOpenSupplierForm]        = useState(false);

  // FIX: seed from purchase.supplier.openingBalance when editing,
  // so totalPayable and dueDisplay are correct on first render.
  const [openingBalance, setOpeningBalance] = useState<number>(() =>
    safeNum((purchase as any)?.supplier?.openingBalance ?? 0)
  );

  const fetchSupplierList = async () => {
    const res = await getSupplierListForDropdown();
    setSupplierList(res);
  };

  useEffect(() => {
    const load = async () => {
      const [suppliers, branches] = await Promise.all([
        getSupplierListForDropdown(),
        getBranchListForDropdown(),
      ]);
      setSupplierList(suppliers);
      setBranchList(branches);
    };
    load();
  }, []);

  const form = useForm<z.infer<typeof fullPurchaseSchema>>({
    resolver: zodResolver(fullPurchaseSchema),
    defaultValues: {
      supplierId:   purchase?.supplierId  ?? "",
      referenceNo:  purchase?.referenceNo ?? (purchase as any)?.purchaseNo ?? "",
      branchId:     purchase?.branchId    ?? "",
      purchaseDate: normalizeToUtcMidnight(purchase?.purchaseDate),
      totalAmount:  purchase?.totalAmount ?? 0,
      dueAmount:    purchase?.dueAmount   ?? 0,
      paidAmount:   purchase?.paidAmount  ?? 0,
      items:        purchase?.items       ?? [],
      payments: purchase?.payments ?? [
        {
          amount:        0,
          paidOn:        getTodayUtcMidnight(),
          paymentMethod: "",
          paymentNote:   "",
          dueDate:       null,
        },
      ],
    },
  });

  // FIX: when purchase prop changes (sheet opens for a different record),
  // reset the form AND re-seed openingBalance from the supplier on the record.
  useEffect(() => {
    if (!purchase) {
      form.setValue("referenceNo", `REF-${nanoid(4).toUpperCase()}`);
      setOpeningBalance(0);
    } else {
      form.reset({
        supplierId:   purchase.supplierId  ?? "",
        referenceNo:  purchase.referenceNo ?? (purchase as any).purchaseNo ?? "",
        branchId:     purchase.branchId    ?? "",
        purchaseDate: normalizeToUtcMidnight(purchase.purchaseDate),
        totalAmount:  purchase.totalAmount ?? 0,
        dueAmount:    purchase.dueAmount   ?? 0,
        paidAmount:   purchase.paidAmount  ?? 0,
        items: (purchase.items ?? []).map((item: any) => ({
          productId:    item.productId,
          product_name: item.product?.productName ?? item.product_name ?? "",
          stock:        safeNum(item.product?.stock ?? item.stock),
          quantity:     safeNum(item.quantity),
          unitPrice:    safeNum(item.unitPrice),
          discount:     safeNum(item.discount ?? 0),
          subtotal:     safeNum(item.quantity) * safeNum(item.unitPrice),
          total:        safeNum(item.total),
        })),
        payments: (purchase.payments ?? []).length > 0
          ? (purchase.payments as any[]).map((p) => ({
              amount:        safeNum(p.amount),
              paidOn:        p.paidOn  ? normalizeToUtcMidnight(new Date(p.paidOn))  : getTodayUtcMidnight(),
              paymentMethod: p.paymentMethod?.toLowerCase() ?? "",
              paymentNote:   p.paymentNote  ?? "",
              dueDate:       p.dueDate ? normalizeToUtcMidnight(new Date(p.dueDate)) : null,
            }))
          : [{ amount: 0, paidOn: getTodayUtcMidnight(), paymentMethod: "", paymentNote: "", dueDate: null }],
      });
      // FIX: seed openingBalance from the supplier attached to this purchase
      setOpeningBalance(safeNum((purchase as any).supplier?.openingBalance ?? 0));
    }
  }, [purchase?.id]); // only re-run when the actual record changes

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const products = await getProductDropdown({ query: productSearch });
        setProductOptions(products);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  // ---------------------------------------------------------------------------
  // Derived totals
  // ---------------------------------------------------------------------------

  const watchedItems    = form.watch("items");
  const watchedPayments = form.watch("payments");

  const grandTotal = watchedItems.reduce((sum, item) => sum + safeNum(item.total), 0);

  // FIX: totalPayable includes opening balance, same as the create form
  const totalPayable = safeNum(openingBalance) + grandTotal;

  const amountPaid = safeNum(watchedPayments[0]?.amount);

  // FIX: dueDisplay = totalPayable - amountPaid (not grandTotal - amountPaid)
  const dueDisplay = Math.max(0, totalPayable - amountPaid);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (data: z.infer<typeof fullPurchaseSchema>) => {
    const computedGrandTotal   = data.items.reduce((sum, item) => sum + safeNum(item.total), 0);
    // FIX: totalPayable and dueAmount must include opening balance
    const computedTotalPayable = safeNum(openingBalance) + computedGrandTotal;
    const computedPaid         = data.payments.reduce((sum, p) => sum + safeNum(p.amount), 0);
    const computedDue          = Math.max(0, computedTotalPayable - computedPaid);

    const payload = {
      ...data,
      totalAmount:  computedGrandTotal,
      paidAmount:   computedPaid,
      dueAmount:    computedDue,
      totalPayable: computedTotalPayable,
      purchaseDate: data.purchaseDate instanceof Date
        ? data.purchaseDate.toISOString()
        : data.purchaseDate,
      payments: data.payments.map((p) => ({
        ...p,
        paidOn:  p.paidOn  instanceof Date ? p.paidOn.toISOString()  : p.paidOn,
        dueDate: p.dueDate instanceof Date ? p.dueDate.toISOString() : (p.dueDate ?? null),
      })),
    };

    if (purchase) {
      await update({ id: purchase.id, ...payload });
      toast.success("Purchase updated successfully");
    } else {
      await create(payload as any);
      toast.success("Purchase created successfully");
    }

    if (isControlled && openChange) openChange(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button>
            <Plus className="mr-2" />
            New Purchase
          </Button>
        </SheetTrigger>
      )}

      <SheetContent side="top" className="max-h-screen overflow-y-auto p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <SheetHeader>
              <SheetTitle>{purchase ? "Edit Purchase" : "New Purchase"}</SheetTitle>
            </SheetHeader>

            {/* ── Purchase Details ─────────────────────────────────────────── */}
            <Card className="grid md:grid-cols-2 gap-4 p-4">

              {/* Supplier */}
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Supplier *</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Popover
                          open={showSupplierSuggestions}
                          onOpenChange={setShowSupplierSuggestions}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {supplierList.find((s) => s.id === field.value)?.name
                                || "Select supplier..."}
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
                                        // FIX: update openingBalance when supplier changes mid-edit
                                        setOpeningBalance(safeNum(supplier.openingBalance));
                                        setShowSupplierSuggestions(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          supplier.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0",
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
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setOpenSupplierForm(true)}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {branchList.find((b) => b.id === field.value)?.name
                            || "Select Branch..."}
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
                                        : "opacity-0",
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

              {/* Reference No */}
              <FormField
                control={form.control}
                name="referenceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Auto-generated on save" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purchase Date */}
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button type="button" variant="outline" className="w-full text-left">
                            {field.value ? formatDate(field.value) : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => field.onChange(normalizeToUtcMidnight(d))}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            {/* ── Products ─────────────────────────────────────────────────── */}
            <Card className="p-4 space-y-4">
              <FormItem className="relative max-w-sm">
                <FormLabel className="mb-1">Add Product</FormLabel>
                <Popover
                  open={productOptions.length > 0}
                  onOpenChange={() => setProductOptions([])}
                >
                  <PopoverTrigger asChild>
                    <div>
                      <Input
                        placeholder="Search product…"
                        className="pl-9"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                      <Search className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
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
                                const purchasePrice = safeNum(p.purchasePrice);
                                
                                  const sellingPrice  = safeNum(p.sellingPrice ?? p.purchasePrice);

                                const stock         = safeNum(p.stock);
                                append({
                                  productId:    p.id,
                                  product_name: p.product_name ?? "",
                                  stock,
                                  quantity:     1,
                                  unitPrice:    purchasePrice,
                                  discount:     0,
                                      sellingPrice,

                                  subtotal:     purchasePrice,
                                  total:        purchasePrice,
                                });
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

              {fields.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[1200px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields
                          .filter((f) => f.productId && f.product_name)
                          .map((f, idx) => (
                            <TableRow key={f.id}>
                              <TableCell>{f.product_name || "—"}</TableCell>
                              <TableCell>{safeNum(f.stock)}</TableCell>

                              {/* Editable: qty, unitPrice, discount */}
                              {ITEM_FIELD_KEYS.map((key) => (
                                <TableCell key={key}>
                                  <FormField
                                    control={form.control}
                                    name={`items.${idx}.${key}`}
                                    render={({ field: inputField }) => (
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
                                          className="min-w-[5rem]"
                                          value={safeVal(inputField.value)}
                                          onChange={(e) => {
                                            const raw   = e.target.value;
                                            const value = raw === "" ? 0 : safeNum(raw);
                                            inputField.onChange(value);

                                            const row      = form.getValues(`items.${idx}`);
                                            const current  = { ...row, [key]: value };
                                            const qty      = safeNum(current.quantity);
                                            const price    = safeNum(current.unitPrice);
                                            const discount = safeNum(current.discount);
                                            const subtotal = qty * price;
                                            const total    = Math.max(0, subtotal - discount);

                                            form.setValue(`items.${idx}.subtotal`, subtotal, { shouldDirty: true });
                                            form.setValue(`items.${idx}.total`,    total,    { shouldDirty: true });
                                          }}
                                        />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                              ))}

                              {/* FIX: read-only computed cells — not inputs */}
                              <TableCell className="min-w-[5rem] text-right">
                                {safeNum(form.watch(`items.${idx}.subtotal`)).toFixed(2)}
                              </TableCell>
                              <TableCell className="min-w-[5rem] text-right font-medium">
                                {safeNum(form.watch(`items.${idx}.total`)).toFixed(2)}
                              </TableCell>

                              <TableCell>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => remove(idx)}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end pr-4">
                    <div className="text-right space-y-1">
                      <div className="text-muted-foreground text-sm">Grand Total</div>
                      <div className="text-xl font-semibold">
                        {CURRENCY_SYMBOL} {grandTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground bg-muted/20 border-2 border-dashed rounded-lg">
                  <p>No products added yet.</p>
                  <p>Search and select products above to add them to the purchase.</p>
                </div>
              )}
            </Card>

            {/* ── Payment ──────────────────────────────────────────────────── */}
            <Card className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">Add Payment</h3>

              {/* FIX: same summary row as the create form */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Opening Balance
                  </p>
                  <p className="text-lg font-semibold">
                    {CURRENCY_SYMBOL} {safeNum(openingBalance).toFixed(2)}
                  </p>
                </div>
                <div className="text-center border-x">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Grand Total
                  </p>
                  <p className="text-lg font-semibold">
                    {CURRENCY_SYMBOL} {grandTotal.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Total Payable
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {CURRENCY_SYMBOL} {totalPayable.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payments.0.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={safeVal(field.value)}
                          onChange={(e) => {
                            const v = e.target.value === "" ? 0 : safeNum(e.target.value);
                            field.onChange(v);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payments.0.paidOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button type="button" variant="outline" className="w-full text-left">
                              {field.value ? formatDate(field.value) : formatDate(new Date())}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(d) => field.onChange(normalizeToUtcMidnight(d))}
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payments.0.paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payments.0.paymentNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Note</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Due Amount */}
              <div className="flex justify-end pr-4">
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground text-sm">Due Amount</div>
                  <div className={cn(
                    "text-xl font-semibold",
                    dueDisplay > 0 ? "text-destructive" : "text-green-600",
                  )}>
                    {CURRENCY_SYMBOL} {dueDisplay.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Due Date — only when outstanding balance exists */}
              {dueDisplay > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payments.0.dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button type="button" variant="outline" className="w-full text-left">
                                {field.value ? formatDate(field.value) : "Select date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(d) => field.onChange(normalizeToUtcMidnight(d))}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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

      <SupplierFormDialog
        supplier={undefined}
        open={openSupplierForm}
        branches={branchList}
        openChange={(o) => {
          setOpenSupplierForm(o);
          if (!o) fetchSupplierList();
        }}
      />
    </Sheet>
  );
};