'use client';

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
import { createPurchase } from "@/actions/purchase-actions";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { getProductDropdown } from "@/actions/product-actions";
import { useWatch } from "react-hook-form";

import { useEffect, useState, memo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card } from "../ui/card";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { nanoid } from "nanoid";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "bank", label: "Bank Transfer" },
  { value: "other", label: "Other" },
] as const;

const ITEM_FIELD_KEYS: PurchaseItemField[] = ["quantity", "unitPrice", "discount"];

// ---------------------------------------------------------------------------
// Helpers — always produce a safe finite number for display / calculation
// ---------------------------------------------------------------------------
const UnitPriceInput = ({ idx, form }: { idx: number; form: any }) => {
  return (
    <FormField
      control={form.control}
      name={`items.${idx}.unitPrice`}
      render={({ field: inputField }) => (
        <FormControl>
          <Input
            type="number"
            min={0}
            className="min-w-[5rem]"
            value={safeVal(inputField.value)}
            onChange={(e) => {
              const value = e.target.value === "" ? 0 : safeNum(e.target.value);
              inputField.onChange(value);
              const row = form.getValues(`items.${idx}`);
              const qty = safeNum(row.quantity);
              const discount = safeNum(row.discount);
              const subtotal = qty * value;
              const total = Math.max(0, subtotal - discount);
              form.setValue(`items.${idx}.subtotal`, subtotal, { shouldDirty: true });
              form.setValue(`items.${idx}.total`, total, { shouldDirty: true });
            }}
          />
        </FormControl>
      )}
    />
  );
};
/** Returns 0 for NaN / null / undefined / Infinity */
const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Safe value prop for <Input type="number"> — never passes NaN to React */
const safeVal = (v: unknown): number | "" => {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PurchaseFormPageProps {
  suppliers: { name: string; id: string; openingBalance: number }[];
  branches: { name: string; id: string }[];
}
// ── OUTSIDE PurchaseFormPage, after helpers ──────────────────────────────────

interface ItemRowProps {
  f: any;
  idx: number;
  form: any;
  onRemove: (idx: number) => void;
}

const ItemRow = memo(({ f, idx, form, onRemove }: ItemRowProps) => {

  const subtotal = useWatch({ control: form.control, name: `items.${idx}.subtotal` });
  const total = useWatch({ control: form.control, name: `items.${idx}.total` });

  return (
    <TableRow key={f.id}>
      <TableCell>{f.product_name || "—"}</TableCell>
      <TableCell>{safeNum(f.stock)}</TableCell>

      {/* Quantity */}
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${idx}.quantity`}
          render={({ field: inputField }) => (
            <FormControl>
              <Input
                type="number"
                min={1}
                className="min-w-[5rem]"
                value={safeVal(inputField.value)}
                onChange={(e) => {
                  const value = e.target.value === "" ? 1 : safeNum(e.target.value);
                  inputField.onChange(value);
                  const row = form.getValues(`items.${idx}`);
                  const price = safeNum(row.unitPrice);
                  const discount = safeNum(row.discount);
                  const subtotal = value * price;
                  const total = Math.max(0, subtotal - discount);
                  form.setValue(`items.${idx}.subtotal`, subtotal, { shouldDirty: true });
                  form.setValue(`items.${idx}.total`, total, { shouldDirty: true });
                }}
              />
            </FormControl>
          )}
        />
      </TableCell>

      {/* Purchase Price */}
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${idx}.unitPrice`}
          render={({ field: inputField }) => (
            <FormControl>
              <Input
                type="number"
                min={0}
                className="min-w-[5rem]"
                value={safeVal(inputField.value)}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : safeNum(e.target.value);
                  inputField.onChange(value);
                  const row = form.getValues(`items.${idx}`);
                  const qty = safeNum(row.quantity);
                  const discount = safeNum(row.discount);
                  const subtotal = qty * value;
                  const total = Math.max(0, subtotal - discount);
                  form.setValue(`items.${idx}.subtotal`, subtotal, { shouldDirty: true });
                  form.setValue(`items.${idx}.total`, total, { shouldDirty: true });
                }}
              />
            </FormControl>
          )}
        />
      </TableCell>

      {/* Selling Price */}
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${idx}.sellingPrice` as any}
          render={({ field: inputField }) => (
            <FormControl>
              <Input
                type="number"
                min={0}
                className="min-w-[5rem] bg-muted/30"
                value={safeVal(inputField.value)}
                onChange={(e) => {
                  inputField.onChange(e.target.value === "" ? 0 : safeNum(e.target.value));
                }}
              />
            </FormControl>
          )}
        />
      </TableCell>

      {/* Discount */}
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${idx}.discount`}
          render={({ field: inputField }) => (
            <FormControl>
              <Input
                type="number"
                min={0}
                className="min-w-[5rem]"
                value={safeVal(inputField.value)}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : safeNum(e.target.value);
                  inputField.onChange(value);
                  const row = form.getValues(`items.${idx}`);
                  const qty = safeNum(row.quantity);
                  const price = safeNum(row.unitPrice);
                  const subtotal = qty * price;
                  const total = Math.max(0, subtotal - value);
                  form.setValue(`items.${idx}.subtotal`, subtotal, { shouldDirty: true });
                  form.setValue(`items.${idx}.total`, total, { shouldDirty: true });
                }}
              />
            </FormControl>
          )}
        />
      </TableCell>

      <TableCell className="min-w-[5rem] text-right">
        {safeNum(subtotal).toFixed(2)}
      </TableCell>
      <TableCell className="min-w-[5rem] text-right font-medium">
        {safeNum(total).toFixed(2)}
      </TableCell>

      <TableCell>
        <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(idx)}>
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
});
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PurchaseFormPage = ({
  suppliers,
  branches,
}: PurchaseFormPageProps) => {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [supplierList, setSupplierList] = useState(suppliers);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);

  // Opening balance of the currently selected supplier (drives totalPayable)
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const [branchList] = useState(branches);
  const [openSupplierForm, setOpenSupplierForm] = useState(false);

  const handleSupplierAdded = async () => {
    const res = await getSupplierListForDropdown();
    setSupplierList(res);
  };
  // Add this OUTSIDE PurchaseFormPage component

  const form = useForm<z.infer<typeof fullPurchaseSchema>>({
    resolver: zodResolver(fullPurchaseSchema),
    defaultValues: {
      supplierId: "",
      referenceNo: "",
      branchId: "",
      purchaseDate: new Date(),
      totalAmount: 0,
      dueAmount: 0,
      paidAmount: 0,
      items: [],
      payments: [
        {
          amount: 0,
          paidOn: new Date(),
          paymentMethod: "",
          paymentNote: "",
          dueDate: null,
        },
      ],
    },
  });

  useEffect(() => {
    form.setValue("referenceNo", `REF-${nanoid(4).toUpperCase()}`);
  }, [form]);

 const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "items",
});

const handleRemove = useCallback((idx: number) => remove(idx), [remove]);

  // Product search with debounce
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
  // Derived totals (watched live)
  // ---------------------------------------------------------------------------

  const itemTotals = useWatch({ control: form.control, name: "items" });
  const watchedPayments = useWatch({ control: form.control, name: "payments" });

  /** Grand total of all line items */
  const grandTotal = (itemTotals ?? []).reduce(
    (sum: number, item: any) => sum + safeNum(item?.total),
    0,
  );

  /**
   * Total Payable = Opening Balance + Grand Total
   * This is the real amount the buyer owes before any payment.
   */
  const totalPayable = safeNum(openingBalance) + grandTotal;

  /** Amount paid from the first payment entry */
  const amountPaid = safeNum(watchedPayments[0]?.amount);

  /**
   * Due Amount = Total Payable − Amount Paid
   * Clamped to 0 so it never goes negative in the display.
   */
  const dueDisplay = Math.max(0, totalPayable - amountPaid);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (data: z.infer<typeof fullPurchaseSchema>) => {
    if (!data.supplierId) { toast.error("Please select a supplier"); return; }
    if (!data.branchId) { toast.error("Please select a business location"); return; }
    if (!data.items || data.items.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    const computedGrandTotal = data.items.reduce((sum, item) => sum + safeNum(item.total), 0);
    const computedTotalPayable = safeNum(openingBalance) + computedGrandTotal;
    const computedPaid = data.payments.reduce((sum, p) => sum + safeNum(p.amount), 0);
    const computedDue = Math.max(0, computedTotalPayable - computedPaid);

    const payload = {
      ...data,
      totalAmount: computedGrandTotal,
      paidAmount: computedPaid,
      dueAmount: computedDue,
      // Pass totalPayable explicitly so the backend stores the correct paymentDue
      // (supplierOpeningBalance + grandTotal − amountPaid).
      totalPayable: computedTotalPayable,
      purchaseDate: data.purchaseDate instanceof Date
        ? data.purchaseDate.toISOString()
        : data.purchaseDate,
      payments: data.payments.map((p) => ({
        ...p,
        paidOn: p.paidOn instanceof Date ? p.paidOn.toISOString() : p.paidOn,
        dueDate: p.dueDate instanceof Date ? p.dueDate.toISOString() : (p.dueDate ?? null),
      })),
    };

    setIsCreating(true);
    try {
      const result = await createPurchase(payload as any);

      if (result?.data) {
        toast.success("Purchase created successfully");
        router.push("/purchase");
      } else if ((result as any)?.serverError) {
        toast.error((result as any).serverError);
      } else if ((result as any)?.validationErrors) {
        console.error("Validation errors:", (result as any).validationErrors);
        toast.error("Validation failed — check console");
      } else if ((result?.data as any)?.error) {
        toast.error((result?.data as any).error);
      } else {
        toast.error("Something went wrong");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Purchase</h1>
        <p className="text-muted-foreground">Fill out the purchase details below</p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

          {/* ── Purchase Details ─────────────────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Purchase Details</h2>
            <div className="grid md:grid-cols-2 gap-4">

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
                                        // Update opening balance whenever supplier changes
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
                  <FormItem>
                    <FormLabel>Business Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branchList.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input {...field} />
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
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full text-left"
                          >
                            {field.value ? formatDate(field.value) : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* ── Products ─────────────────────────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Products</h2>

            {/* Product search */}
            <FormItem className="relative max-w-sm mb-4">
              <FormLabel className="mb-1">Search Product</FormLabel>
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
                              console.log('Product dropdown item:', p); // ← add this

                              // FIX: safeNum on every field so no NaN reaches <Input>
                              const purchasePrice = safeNum(p.purchasePrice);
                              const sellingPrice = safeNum(p.sellingPrice ?? p.purchasePrice);

                              const stock = safeNum(p.stock);
                              append({
                                productId: p.id,
                                product_name: p.product_name ?? "",
                                stock,
                                quantity: 1,
                                unitPrice: purchasePrice,
                                sellingPrice,

                                discount: 0,
                                subtotal: purchasePrice,        // qty(1) * price
                                total: purchasePrice,        // subtotal - discount(0)
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

            {/* Items table */}
            {/* Items table */}
            <div className="overflow-x-auto">
              {fields.length > 0 ? (
                <>
                  <Table className="min-w-[1400px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
  {fields.map((f, idx) => {
    if (!f.productId || !f.product_name) return null;
return <ItemRow key={f.id} f={f} idx={idx} form={form} onRemove={handleRemove} />;
  })}
</TableBody>
                  </Table>

                  {/* Grand Total */}
                  <div className="flex justify-end pr-4 mt-4">
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
            </div>
          </Card>

          {/* ── Payment ──────────────────────────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Payment</h2>

            {/* ── Summary row: Opening Balance / Grand Total / Total Payable ── */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/30 border">
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
              {/* Amount Paid */}
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
                        // FIX: safeVal prevents NaN value attribute
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

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payments.0.paidOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full text-left"
                          >
                            {field.value ? formatDate(field.value) : formatDate(new Date())}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
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

              {/* Payment Note */}
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

            {/* Due Amount summary */}
            <div className="flex justify-end pr-4 mt-4">
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

            {/* Due Date — only shown when there is an outstanding amount */}
            {dueDisplay > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="payments.0.dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full text-left"
                            >
                              {field.value ? formatDate(field.value) : "Select date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
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

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/purchase")}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Purchase"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <SupplierFormDialog
        supplier={undefined}
        open={openSupplierForm}
        branches={branches}
        openChange={(open) => {
          setOpenSupplierForm(open);
          if (!open) handleSupplierAdded();
        }}
      />
    </div>
  );
};