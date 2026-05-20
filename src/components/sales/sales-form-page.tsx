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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { SaleItemField } from "@/types/sales";
import { fullSalesSchema } from "@/schemas/sales-item-schema";
import { getProductListForDropdown } from "@/actions/product-actions";
import { Command, CommandGroup, CommandItem, CommandInput, CommandEmpty, CommandList } from "../ui/command";
import { nanoid } from "nanoid";
import { getAllBranches } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import { SalesStatusEnum } from "@/schemas/sales-schema";

// Define props interface
interface SalesFormPageProps {
  customers: { id: string; name: string; openingBalance: number }[];
  branches: { name: string; id: string }[];
}

export const SalesFormPage = ({ customers, branches }: SalesFormPageProps) => {
  const router = useRouter();
  const { execute: create, isExecuting: isCreating } = useAction(createSale);
  const [customerList, setCustomerList] = useState<{ id: string; name: string, openingBalance: number }[]>(customers);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedCustomerOpeningBalance, setSelectedCustomerOpeningBalance] = useState<number | null>(null);
  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>(branches);
  const [openCustomerForm, setOpenCustomerForm] = useState(false);

  const form = useForm<z.infer<typeof fullSalesSchema>>({
    resolver: zodResolver(fullSalesSchema) as any,
    defaultValues: {
      invoiceNo: "",
      branchId: "",
      customerId: "",
      status: "Dispatched",
      grandTotal: 0,
      dueAmount: 0,
      paidAmount: 0,
      salesdate: new Date(),
      items: [],
      salesPayment: [{
        amount: 0,
        paidOn: new Date(),
        paymentMethod: "cash",
        paymentNote: "",
      }],
    }
  });

  const itemFieldKeys = [
    "quantity",
    "unitPrice",
    "discount",
    "subtotal",
    "total",
  ] as const;

  const year = new Date().getFullYear();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Removed fetchCustomerList and fetchBranches effects as data is passed via props

  // We still need to update customer list if a new customer is added via the modal
  const handleCustomerAdded = async () => {
    const res = await getCustomerListForDropdown();
    setCustomerList(res);
  };

  // Set invoice number after component mounts to avoid hydration issues
  useEffect(() => {
    form.setValue("invoiceNo", `INV-${year}-${nanoid(4).toUpperCase()}`);
  }, [form, year]);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const res = await getProductListForDropdown({ query: productSearch });
        setProductOptions(res?.data?.products || []);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  const handleSubmit = async (data: z.infer<typeof fullSalesSchema>) => {
    const grandTotal = data.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const paidAmount = data.salesPayment.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const dueAmount = grandTotal - paidAmount;

    form.setValue("grandTotal", grandTotal);
    form.setValue("paidAmount", paidAmount);
    form.setValue("dueAmount", dueAmount);

    const payload = {
      ...data,
      grandTotal,
      paidAmount,
      dueAmount
    };

    try {
      await create(payload);
      toast.success("Sale created successfully");
      router.push("/sales");
    } catch {
      toast.error("Failed to create sale");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Sale</h1>
        <p className="text-muted-foreground">Fill out the sale details below</p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Sale Details Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sale Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Popover open={showCustomerSuggestions} onOpenChange={setShowCustomerSuggestions}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {customerList.find((c) => c.id === field.value)?.name || "Select customer..."}
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
                                        setSelectedCustomerOpeningBalance(customer.openingBalance);
                                        setShowCustomerSuggestions(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          customer.id === field.value ? "opacity-100" : "opacity-0"
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

              <FormField control={form.control} name="branchId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Location</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {baranchList.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField
                control={form.control}
                name="invoiceNo"
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

          {/* Products Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Products</h2>
            <FormItem className="relative max-w-sm mb-4">
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
                              // Simplified logic: Selling Price is flat, no additional tax
                              const unitPrice = p.purchasePrice || 0;

                              append({
                                productId: p.id,
                                quantity: 1,
                                product_name: p.product_name,
                                stock: p.stock,
                                discount: 0,
                                purchasePrice: p.purchasePrice,
                                subtotal: unitPrice,
                                total: unitPrice,
                                unitPrice: unitPrice,
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
                      <TableHead>Buying Price</TableHead>
                      <TableHead>Selling Price</TableHead>
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

                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${idx}.quantity`}
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  type="number"
                                  className="min-w-18"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    field.onChange(value);

                                    const currentValues = form.getValues(`items.${idx}`);
                                    const discount = Number(currentValues.discount);
                                    let unitPrice = Number(currentValues.unitPrice);

                                    const subtotal = value * unitPrice;
                                    const total = subtotal - discount;

                                    form.setValue(`items.${idx}.subtotal`, subtotal);
                                    form.setValue(`items.${idx}.total`, total);
                                  }}
                                />
                              </FormControl>
                            )}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={f.purchasePrice || 0}
                            disabled
                            readOnly
                          />
                        </TableCell>

                        {itemFieldKeys.filter(k => k !== 'quantity').map((key) => (
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
                                    value={
                                      (field.value === undefined || field.value === null || Number.isNaN(field.value))
                                        ? ""
                                        : field.value
                                    }
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      field.onChange(value);

                                      const currentValues = form.getValues(`items.${idx}`);
                                      const quantity = Number(currentValues.quantity);
                                      const discount = Number(currentValues.discount);

                                      let unitPrice = Number(currentValues.unitPrice);

                                      if (key === "unitPrice") {
                                        unitPrice = value;
                                      }

                                      const subtotal = quantity * unitPrice;
                                      const total = subtotal - discount;

                                      form.setValue(`items.${idx}.subtotal`, subtotal);
                                      form.setValue(`items.${idx}.total`, total);
                                    }}
                                    readOnly={key === "subtotal" || key === "total"}
                                    disabled={key === "subtotal" || key === "total"}
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
                <div className="flex justify-end pr-4 mt-4">
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
                <p>Search and select products above to add them to the sale.</p>
              </div>
            )}
          </Card>

          {/* Payment Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Payment</h2>

            {selectedCustomerOpeningBalance !== null && (
              <div className="text-sm text-muted-foreground mb-4">
                Opening Balance: {CURRENCY_SYMBOL} {selectedCustomerOpeningBalance.toFixed(2)}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salesPayment.0.amount"
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
              <div className="text-right space-y-1">
                <div className="text-muted-foreground text-sm">Due Amount:</div>
                <div className="text-xl font-semibold">
                  {CURRENCY_SYMBOL}{" "}
                  {(
                    form.watch("items").reduce(
                      (sum, item) => sum + (Number(item.total) || 0),
                      0
                    ) -
                    form.watch("salesPayment").reduce(
                      (sum, p) => sum + (Number(p.amount) || 0),
                      0
                    )
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {(() => {
              const total = form
                .watch("items")
                .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
              const paid = form
                .watch("salesPayment")
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
              const due = total - paid;

              if (due > 0) {
                return (
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
                );
              }
              return null;
            })()}
          </Card>

          {/* Action Buttons */}
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

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        customer={undefined}
        open={openCustomerForm}
        openChange={(open) => {
          setOpenCustomerForm(open);
          if (!open) {
            handleCustomerAdded();
          }
        }}
        branches={branches}
      />
    </div>
  );
};
