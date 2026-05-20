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
import { getProductListForDropdown } from "@/actions/product-actions";
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
import { purchaseStatusEnum } from "@/schemas/purchase-schema";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { nanoid } from "nanoid";
import { getAllBranches } from "@/actions/auth";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form";


export const PurchaseFormSheet = ({
  purchase,
  open,
  openChange,
}: PurchaseFormProps) => {
  const purchaseStatusOption = purchaseStatusEnum.options;
  const isControlled = typeof open === "boolean";
  const { execute: create, isExecuting: isCreating } = useAction(createPurchase);
  const { execute: update, isExecuting: isUpdating } = useAction(updatePurchase);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [supplierList, setSupplierList] = useState<{ name: string; id: string, openingBalance: number }[]>([]);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [selectedSupplierOpeningBalance, setSelectedSupplierOpeningBalance] = useState<number | null>(null);
  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>([]);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);
  const [openSupplierForm, setOpenSupplierForm] = useState(false);

  const itemFieldKeys: PurchaseItemField[] = [
    "quantity",
    "unitPrice",
    "discount",
    "subtotal",
    "total",
  ];




  const fetchSupplierList = async () => {
    const res = await getSupplierListForDropdown();
    setSupplierList(res);
  };


  useEffect(() => {
    const fetchOptions = async () => {
      const [res, branches] = await Promise.all([
        getSupplierListForDropdown(),
        getAllBranches(),
      ]);
      setSupplierList(res);
      setBranchList(branches);
    };
    fetchOptions();
  }, []);

  const form = useForm<z.infer<typeof fullPurchaseSchema>>({
    resolver: zodResolver(fullPurchaseSchema),
    defaultValues: {
      supplierId: purchase?.supplierId || "",
      referenceNo: purchase?.referenceNo || "",
      branchId: purchase?.branchId || "",
      purchaseDate: normalizeToUtcMidnight(purchase?.purchaseDate),
      status: purchase?.status ?? "Received",
      totalAmount: purchase?.totalAmount || 0,
      dueAmount: purchase?.dueAmount || 0,
      paidAmount: purchase?.paidAmount || 0,
      items: purchase?.items || [],
      payments: purchase?.payments || [{
        amount: 0,
        paidOn: getTodayUtcMidnight(),
        paymentMethod: "",
        paymentNote: "",
        dueDate: null
      }]
    },
  });

  useEffect(() => {
    if (!purchase) {
      form.setValue("referenceNo", `REF-${nanoid(4).toUpperCase()}`);
    } else {
      form.reset({
        supplierId: purchase?.supplierId || "",
        referenceNo: purchase?.referenceNo || "",
        branchId: purchase?.branchId || "",
        purchaseDate: normalizeToUtcMidnight(purchase?.purchaseDate),
        status: purchase?.status ?? "Received",
        totalAmount: purchase?.totalAmount || 0,
        dueAmount: purchase?.dueAmount || 0,
        paidAmount: purchase?.paidAmount || 0,
        items: purchase?.items || [],
        payments: purchase?.payments || [{
          amount: 0,
          paidOn: getTodayUtcMidnight(),
          paymentMethod: "",
          paymentNote: "",
          dueDate: null
        }]
      });
    }
  }, [form, purchase]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Removed useWatch hooks that were causing empty items to be created


  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const res = await getProductListForDropdown({ query: productSearch });
        setProductOptions(res?.data?.products || []);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);


  const handleSubmit = async (data: z.infer<typeof fullPurchaseSchema>) => {

    const totalAmount = data.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const paidAmount = data.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const dueAmount = totalAmount - paidAmount

    form.setValue("totalAmount", totalAmount);
    form.setValue("paidAmount", paidAmount)
    form.setValue("dueAmount", dueAmount);

    const payload = {
      ...data,
      totalAmount,
      paidAmount,
      dueAmount
    };

    if (purchase) {
      await update({ id: purchase.id, ...payload });
      toast.success("Purchase updated successfully");
    } else {
      await create(payload);
      toast.success("Purchase created successfully");
    }

    if (isControlled && openChange) openChange(false);
  };


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

            <Card className="grid md:grid-cols-2 gap-4 p-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Supplier *</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Popover open={showSupplierSuggestions} onOpenChange={setShowSupplierSuggestions}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {supplierList.find((s) => s.id === field.value)?.name || "Select supplier..."}
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
                                        setSelectedSupplierOpeningBalance(supplier.openingBalance);
                                        setShowSupplierSuggestions(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          supplier.id === field.value ? "opacity-100" : "opacity-0"
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

              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Business Location</FormLabel>
                    <Popover open={showBranchSuggestions} onOpenChange={setShowBranchSuggestions}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                        >
                          {baranchList.find((b) => b.id === field.value)?.name || "Select Branch..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search branch..." />
                          <CommandList>
                            <CommandEmpty>No branch found.</CommandEmpty>
                            <CommandGroup>
                              {baranchList.map((branch) => (
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
                                      branch.id === field.value ? "opacity-100" : "opacity-0"
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
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full text-left">
                            {field.value
                              ? formatDate(field.value)
                              : "Pick date"}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {purchaseStatusOption
                            .filter((s) => s !== "Cancelled")
                            .map((s) => (
                              <SelectItem key={s} value={s}>
                                {s === "Purchase_Order" ? "Ordered" :
                                  s === "Received" ? "Received" : s}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    {/* {field.value === "Purchase_Order" && (
                      <p className="text-sm text-muted-foreground">
                        📋 Purchase Order: Stock and payments will not be updated
                      </p>
                    )}
                    {field.value === "Received_Confirmed" && (
                      <p className="text-sm text-green-600">
                        ✅ Received: Stock quantities and supplier balance will be updated
                      </p>
                    )}
                    {field.value === "Cancelled" && (
                      <p className="text-sm text-red-600">
                        ❌ Cancelled: No stock or payment updates will occur
                      </p>
                    )} */}
                  </FormItem>
                )}
              />
            </Card>

            <Card className="p-4 space-y-4">
              <FormItem className="relative max-w-sm">
                <FormLabel className="mb-1">Add Product</FormLabel>
                <Popover open={productOptions.length > 0} onOpenChange={() => setProductOptions([])}>
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


              {fields.length > 0 ? (
                <>
                  <Table className="min-w-[1500px]">
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
                      {fields.filter(f => f.productId && f.product_name).map((f, idx) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            {f.product_name || "—"}
                          </TableCell>
                          <TableCell>
                            {f.stock}
                          </TableCell>



                          {itemFieldKeys.map((key) => (
                            <TableCell key={key}>
                              <FormField
                                control={form.control}
                                name={`items.${idx}.${key}`}
                                render={({ field }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      className="min-w-18"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        const value = Number(e.target.value);
                                        field.onChange(value); // update field
                                        const quantity = Number(form.getValues(`items.${idx}.quantity`));
                                        const unitPrice = Number(form.getValues(`items.${idx}.unitPrice`));
                                        const discount = Number(form.getValues(`items.${idx}.discount`));

                                        const subtotal = quantity * unitPrice;
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
                      <div className="text-muted-foreground text-sm">Grand Total:</div>
                      <div className="text-xl font-semibold">
                        {CURRENCY_SYMBOL}{" "}
                        {form
                          .watch("items")
                          .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
                          .toFixed(2)}
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
            <Card className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">Add Payment</h3>

              {selectedSupplierOpeningBalance !== null && (
                <div className="text-sm text-muted-foreground mt-1">
                  Opening Balance: {CURRENCY_SYMBOL} {selectedSupplierOpeningBalance.toFixed(2)}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* Amount Payed */}
                <FormField
                  control={form.control}
                  name="payments.0.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Paid On */}
                <FormField
                  control={form.control}
                  name="payments.0.paidOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full text-left">
                              {field.value
                                ? formatDate(field.value)
                                : formatDate(new Date())}
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
                          {["cash", "card", "bank"].map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
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

              {/* Due Section */}
              <div className="flex justify-end pr-4">
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground text-sm">Due Amount:</div>
                  <div className="text-xl font-semibold">
                    {CURRENCY_SYMBOL}{" "}
                    {(
                      form.watch("items").reduce(
                        (sum, item) => sum + (Number(item.total) || 0),
                        0
                      ) -
                      form.watch("payments").reduce(
                        (sum, p) => sum + (Number(p.amount) || 0),
                        0
                      )
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Conditionally show Due Date if amount is due */}
              {(() => {
                const total = form
                  .watch("items")
                  .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                const paid = form
                  .watch("payments")
                  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const due = total - paid;

                if (due > 0) {
                  return (
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
                                  <Button variant="outline" className="w-full text-left">
                                    {field.value
                                      ? formatDate(field.value)
                                      : "Select date"}
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
                  );
                }
                return null;
              })()}
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

      {/* Supplier Form Dialog */}
      <SupplierFormDialog
        supplier={undefined}
        open={openSupplierForm}
        branches={baranchList}
        openChange={(open) => {
          setOpenSupplierForm(open);
          if (!open) {
            // Refresh supplier list when modal closes
            fetchSupplierList();
          }
        }}
      />
    </Sheet>
  );
};
