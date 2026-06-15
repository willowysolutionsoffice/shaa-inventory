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

// Backend PaymentMethod enum — lowercase values mapped to enum in the service
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "bank", label: "Bank Transfer" },
  { value: "other", label: "Other" },
] as const;

const ITEM_FIELD_KEYS: PurchaseItemField[] = [
  "quantity",
  "unitPrice",
  "discount",

];

interface PurchaseFormPageProps {
  suppliers: { name: string; id: string; openingBalance: number }[];
  branches: { name: string; id: string }[];
}

export const PurchaseFormPage = ({
  suppliers,
  branches,
}: PurchaseFormPageProps) => {
  const router = useRouter();

  const { execute: create, isExecuting: isCreating } =
    useAction(createPurchase);

  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [supplierList, setSupplierList] = useState(suppliers);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [selectedSupplierOpeningBalance, setSelectedSupplierOpeningBalance] =
    useState<number | null>(null);
  const [branchList] = useState(branches);
  const [openSupplierForm, setOpenSupplierForm] = useState(false);

  const handleSupplierAdded = async () => {
    const res = await getSupplierListForDropdown();
    setSupplierList(res);
  };

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

  // Set a local reference number (backend auto-generates purchaseNo from a counter)
  useEffect(() => {
    form.setValue("referenceNo", `REF-${nanoid(4).toUpperCase()}`);
  }, [form]);

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

  const handleSubmit = async (data: z.infer<typeof fullPurchaseSchema>) => {
  if (!data.supplierId) { toast.error("Please select a supplier"); return; }
  if (!data.branchId) { toast.error("Please select a business location"); return; }
  if (!data.items || data.items.length === 0) { toast.error("Please add at least one product"); return; }

  const totalAmount = data.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const paidAmount  = data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const dueAmount   = totalAmount - paidAmount;

  const payload = {
    ...data,
    totalAmount,
    paidAmount,
    dueAmount,
    purchaseDate: data.purchaseDate instanceof Date
      ? data.purchaseDate.toISOString()
      : data.purchaseDate,
    payments: data.payments.map(p => ({
      ...p,
      paidOn:  p.paidOn instanceof Date  ? p.paidOn.toISOString()  : p.paidOn,
      dueDate: p.dueDate instanceof Date ? p.dueDate.toISOString() : (p.dueDate ?? null),
    })),
  };

  // ── Validate manually to see exactly what fails ──
  const parsed = fullPurchaseSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("❌ Schema validation failed:", JSON.stringify(parsed.error.format(), null, 2));
    toast.error("Schema failed — check console");
    return;
  }
  console.log("✅ Schema passed:", parsed.data);

  const result = await create(payload as any);
  console.log("Action result:", result);

  if (result?.data) {
    toast.success("Purchase created successfully");
    router.push("/purchase");
  } else if (result?.serverError) {
    toast.error(result.serverError);
  } else if (result?.validationErrors) {
    console.error("Validation errors:", result.validationErrors);
    toast.error("Validation failed — check console");
  } else {
    toast.error("Something went wrong");
  }
};

  const grandTotal = form
    .watch("items")
    .reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const totalPaid = form
    .watch("payments")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const dueDisplay = grandTotal - totalPaid;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Purchase</h1>
        <p className="text-muted-foreground">
          Fill out the purchase details below
        </p>
      </div>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* ── Purchase Details ── */}
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
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {supplierList.find((s) => s.id === field.value)
                                ?.name || "Select supplier..."}
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
                                        setSelectedSupplierOpeningBalance(
                                          supplier.openingBalance,
                                        );
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
                    <FormLabel>Reference No</FormLabel>
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
                            variant="outline"
                            className="w-full text-left"
                          >
                            {field.value
                              ? formatDate(field.value)
                              : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
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

          {/* ── Products ── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Products</h2>
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
                              append({
                                productId: p.id,
                                quantity: 1,
                                product_name: p.product_name,
                                stock: p.stock,
                                discount: 0,
                                unitPrice: p.purchasePrice,
                                subtotal: p.purchasePrice,
                                total: p.purchasePrice,
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

            <div className="overflow-x-auto">
              {fields.length > 0 ? (
                <>
                  <Table className="min-w-[1200px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields
                        .filter((f) => f.productId && f.product_name)
                        .map((f, idx) => (
                          <TableRow key={f.id}>
                            <TableCell>{f.product_name || "—"}</TableCell>
                            <TableCell>{f.stock}</TableCell>

                            {/* Editable fields only */}
                            {ITEM_FIELD_KEYS.map((key) => (
                              <TableCell key={key}>
                                <FormField
                                  control={form.control}
                                  name={`items.${idx}.${key}`}
                                  render={({ field: inputField }) => (
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="min-w-[5rem]"
                                        {...inputField}
                                        value={inputField.value ?? ""}
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          const value = raw === "" ? 0 : Number(raw);
                                          if (isNaN(value)) return;

                                          inputField.onChange(value);

                                          const allValues = form.getValues(`items.${idx}`);
                                          const current = { ...allValues, [key]: value };

                                          const qty = Number(current.quantity) || 0;
                                          const price = Number(current.unitPrice) || 0;
                                          const discount = Number(current.discount) || 0;
                                          const subtotal = qty * price;
                                          const total = subtotal - discount;

                                          form.setValue(`items.${idx}.subtotal`, subtotal, { shouldDirty: true });
                                          form.setValue(`items.${idx}.total`, total, { shouldDirty: true });
                                        }}
                                      />
                                    </FormControl>
                                  )}
                                />
                              </TableCell>
                            ))}

                            {/* Read-only computed cells — no Input, no NaN */}
                            <TableCell className="min-w-[5rem] text-right">
                              {(Number(form.watch(`items.${idx}.subtotal`)) || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="min-w-[5rem] text-right font-medium">
                              {(Number(form.watch(`items.${idx}.total`)) || 0).toFixed(2)}
                            </TableCell>

                            <TableCell>
                              <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end pr-4 mt-4">
                    <div className="text-right space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Grand Total:
                      </div>
                      <div className="text-xl font-semibold">
                        {CURRENCY_SYMBOL} {grandTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground bg-muted/20 border-2 border-dashed rounded-lg">
                  <p>No products added yet.</p>
                  <p>
                    Search and select products above to add them to the
                    purchase.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* ── Payment ── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Payment</h2>

            {selectedSupplierOpeningBalance !== null && (
              <div className="text-sm text-muted-foreground mb-4">
                Opening Balance: {CURRENCY_SYMBOL}{" "}
                {selectedSupplierOpeningBalance.toFixed(2)}
              </div>
            )}

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
                        {...field}
                        value={field.value ?? ""}
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
                          <Button
                            variant="outline"
                            className="w-full text-left"
                          >
                            {field.value
                              ? formatDate(field.value)
                              : formatDate(new Date())}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={field.onChange}
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

            <div className="flex justify-end pr-4 mt-4">
              <div className="text-right space-y-1">
                <div className="text-muted-foreground text-sm">Due Amount:</div>
                <div className="text-xl font-semibold">
                  {CURRENCY_SYMBOL} {dueDisplay.toFixed(2)}
                </div>
              </div>
            </div>

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
                              variant="outline"
                              className="w-full text-left"
                            >
                              {field.value
                                ? formatDate(field.value)
                                : "Select date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
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

          {/* ── Actions ── */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/purchase")}
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