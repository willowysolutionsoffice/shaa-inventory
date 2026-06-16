"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, CURRENCY_SYMBOL, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useEffect, useState } from "react";
import { createSale } from "@/actions/sales-action";
import { useAction } from "next-safe-action/hooks";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { Card } from "../ui/card";
import { ProductOption } from "@/types/product";
import { fullSalesSchema } from "@/schemas/sales-item-schema";
import { getProductDropdown } from "@/actions/product-actions";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandEmpty,
  CommandList,
} from "../ui/command";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import { SalesStatusEnum } from "@/schemas/sales-schema";

// ── Helper: safely convert any value to a finite number ───────────────────────
const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

interface SalesFormPageProps {
  customers: { id: string; name: string; openingBalance: number }[];
  branches:  { name: string; id: string }[];
}

export const SalesFormPage = ({ customers, branches }: SalesFormPageProps) => {
  const router = useRouter();

  const { execute: create, isExecuting: isCreating } = useAction(createSale, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      toast.success("Sale created successfully");
      router.push("/sales");
    },
    onError: () => toast.error("Failed to create sale"),
  });

  const [customerList, setCustomerList] = useState(customers);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSearch, setProductSearch]   = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedCustomerOpeningBalance, setSelectedCustomerOpeningBalance] =
    useState<number | null>(null);
  const [openCustomerForm, setOpenCustomerForm] = useState(false);

  const year = new Date().getFullYear();

  const form = useForm<z.infer<typeof fullSalesSchema>>({
    resolver: zodResolver(fullSalesSchema) as any,
    defaultValues: {
      invoiceNo:    "",
      branchId:     branches[0]?.id ?? "",
      customerId:   "",
      status:       "Dispatched",
      grandTotal:   0,
      dueAmount:    0,
      paidAmount:   0,
      salesdate:    new Date(),
      items:        [],
      salesPayment: [{
        amount:        0,
        paidOn:        new Date(),
        paymentMethod: "cash",
        paymentNote:   "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    form.setValue("invoiceNo", `INV-${year}-${nanoid(4).toUpperCase()}`);
  }, [form, year]);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const res = await getProductDropdown({ query: productSearch });
        setProductOptions(res ?? []);
      } else {
        setProductOptions([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  const handleCustomerAdded = async () => {
    const res = await getCustomerListForDropdown();
    setCustomerList(res);
  };

  const handleSubmit = (data: z.infer<typeof fullSalesSchema>) => {
    const grandTotal = data.items.reduce((sum, item) => sum + toNum(item.total), 0);
    const paidAmount = data.salesPayment.reduce((sum, p) => sum + toNum(p.amount), 0);
    const dueAmount  = grandTotal - paidAmount;
    create({ ...data, grandTotal, paidAmount, dueAmount });
  };

  // unitPrice, discount, subtotal, total — quantity handled separately
  const itemFieldKeys = ["unitPrice", "discount", "subtotal", "total"] as const;

  const watchedItems    = form.watch("items");
  const watchedPayments = form.watch("salesPayment");
  const displayTotal    = watchedItems.reduce((s, i) => s + toNum(i.total), 0);
  const displayPaid     = watchedPayments.reduce((s, p) => s + toNum(p.amount), 0);
  const displayDue      = displayTotal - displayPaid;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Sale</h1>
        <p className="text-muted-foreground">Fill out the sale details below</p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

          {/* ── Sale Details ─────────────────────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sale Details</h2>
            <div className="grid md:grid-cols-2 gap-4">

              {/* Customer */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Popover
                          open={showCustomerSuggestions}
                          onOpenChange={setShowCustomerSuggestions}
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
                              {customerList.find((c) => c.id === field.value)?.name ||
                                "Select customer..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search customer..." />
                              <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                  {customerList.map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.name}
                                      onSelect={() => {
                                        field.onChange(customer.id);
                                        setSelectedCustomerOpeningBalance(
                                          toNum(customer.openingBalance)
                                        );
                                        setShowCustomerSuggestions(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          customer.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {customer.name}
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
                        onClick={() => setOpenCustomerForm(true)}
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
                        {branches.map((branch) => (
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

              {/* Invoice No */}
              <FormField
                control={form.control}
                name="invoiceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sale Date */}
              <FormField
                control={form.control}
                name="salesdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date</FormLabel>
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

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SalesStatusEnum.options
                          .filter((s) => s !== "Cancelled")
                          .map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* ── Products ─────────────────────────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Products</h2>

            <FormItem className="relative max-w-sm mb-4">
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
                              // ── FIX: coerce every numeric field with toNum()
                              // so no NaN ever reaches an <input value>
                              const purchasePrice = toNum(p.purchasePrice);
                              const sellingPrice  = toNum(p.sellingPrice ?? p.purchasePrice);
                              const stock         = toNum(p.stock);
                              const unitPrice     = sellingPrice;
                              const subtotal      = unitPrice;   // qty 1
                              const total         = unitPrice;

                              append({
                                productId:     p.id,
                                product_name:  p.product_name,
                                stock,
                                quantity:      1,
                                purchasePrice,
                                unitPrice,
                                discount:      0,
                                subtotal,
                                total,
                              });
                              setProductSearch("");
                              setProductOptions([]);
                            }}
                          >
                            <div className="flex justify-between w-full gap-4">
                              <span>{p.product_name}</span>
                              <span className="text-muted-foreground text-xs">
                                Stock: {p.stock}
                              </span>
                            </div>
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
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Buy Price</TableHead>
                        <TableHead>Sell Price</TableHead>
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
                            <TableCell className="font-medium min-w-[140px]">
                              {f.product_name || "—"}
                            </TableCell>

                            {/* Stock (display only) */}
                            <TableCell>{toNum(f.stock)}</TableCell>

                            {/* Quantity */}
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${idx}.quantity`}
                                render={({ field }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      className="w-20"
                                      // ── FIX: never pass NaN/undefined to value
                                      value={
                                        field.value == null || Number.isNaN(Number(field.value))
                                          ? ""
                                          : field.value
                                      }
                                      onChange={(e) => {
                                        const qty = toNum(e.target.value, 1);
                                        field.onChange(qty);
                                        const { unitPrice, discount } =
                                          form.getValues(`items.${idx}`);
                                        const subtotal = qty * toNum(unitPrice);
                                        const total    = subtotal - toNum(discount);
                                        form.setValue(`items.${idx}.subtotal`, subtotal);
                                        form.setValue(`items.${idx}.total`, total);
                                      }}
                                    />
                                  </FormControl>
                                )}
                              />
                            </TableCell>

                            {/* Buy Price (read-only display) */}
                            <TableCell>
                              {/* ── FIX: toNum() so disabled Input never gets NaN */}
                              <Input
                                value={toNum(f.purchasePrice)}
                                disabled
                                readOnly
                                className="w-24"
                              />
                            </TableCell>

                            {/* unitPrice | discount | subtotal | total */}
                            {itemFieldKeys.map((key) => (
                              <TableCell key={key}>
                                <FormField
                                  control={form.control}
                                  name={`items.${idx}.${key}`}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="w-24"
                                        // ── FIX: coerce field.value before rendering
                                        value={
                                          field.value == null || Number.isNaN(Number(field.value))
                                            ? ""
                                            : field.value
                                        }
                                        readOnly={key === "subtotal" || key === "total"}
                                        disabled={key === "subtotal" || key === "total"}
                                        onChange={(e) => {
                                          const value = toNum(e.target.value);
                                          field.onChange(value);

                                          const current   = form.getValues(`items.${idx}`);
                                          const qty       = toNum(current.quantity);
                                          const discount  = key === "discount" ? value : toNum(current.discount);
                                          const unitPrice = key === "unitPrice" ? value : toNum(current.unitPrice);
                                          const subtotal  = qty * unitPrice;
                                          const total     = subtotal - discount;

                                          form.setValue(`items.${idx}.subtotal`, subtotal);
                                          form.setValue(`items.${idx}.total`, total);
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

                <div className="flex justify-end pr-4 mt-4">
                  <div className="text-right">
                    <div className="text-muted-foreground text-sm">Grand Total:</div>
                    <div className="text-xl font-semibold">
                      {CURRENCY_SYMBOL} {displayTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground bg-muted/20 border-2 border-dashed rounded-lg">
                <p>No products added yet.</p>
                <p>Search and select products above to add them to the sale.</p>
              </div>
            )}
          </Card>

          {/* ── Payment ──────────────────────────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Payment</h2>

            {selectedCustomerOpeningBalance !== null && (
              <p className="text-sm text-muted-foreground mb-4">
                Opening Balance: {CURRENCY_SYMBOL}{" "}
                {toNum(selectedCustomerOpeningBalance).toFixed(2)}
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salesPayment.0.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={
                          field.value == null || Number.isNaN(Number(field.value))
                            ? ""
                            : field.value
                        }
                        onChange={(e) => field.onChange(toNum(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salesPayment.0.paidOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full text-left">
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

              <FormField
                control={form.control}
                name="salesPayment.0.paymentMethod"
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
                        {["cash", "card", "bank", "upi"].map((m) => (
                          <SelectItem key={m} value={m}>
                            {m.toUpperCase()}
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
                name="salesPayment.0.paymentNote"
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
              <div className="text-right">
                <div className="text-muted-foreground text-sm">Due Amount:</div>
                <div
                  className={cn(
                    "text-xl font-semibold",
                    displayDue > 0 && "text-destructive"
                  )}
                >
                  {CURRENCY_SYMBOL} {displayDue.toFixed(2)}
                </div>
              </div>
            </div>

            {displayDue > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="salesPayment.0.dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full text-left">
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
              onClick={() => router.push("/sales")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Sale"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <CustomerFormDialog
        customer={undefined}
        open={openCustomerForm}
        openChange={(open) => {
          setOpenCustomerForm(open);
          if (!open) handleCustomerAdded();
        }}
        branches={branches}
      />
    </div>
  );
};