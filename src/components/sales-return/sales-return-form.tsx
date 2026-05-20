"use client";

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
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { z } from "zod";

import { fullSalesReturnSchema } from "@/schemas/sales-return-item-schema";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { getProductListForDropdown } from "@/actions/product-actions";
import { createSalesReturn, updateSalesReturn } from "@/actions/sales-return-action";

import { Card } from "../ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
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
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { SalesReturnFormProps, SalesReturnItemField } from "@/types/sales-return";
import { ProductOption } from "@/types/product";
import { useAction } from "next-safe-action/hooks";
import { cn, CURRENCY_SYMBOL, formatDate } from "@/lib/utils";
import { nanoid } from "nanoid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllBranches } from "@/actions/auth";


export const SalesReturnFormSheet = ({
  salesReturn,
  open,
  openChange,
}: SalesReturnFormProps) => {
  const isControlled = typeof open === "boolean";
  const { execute: create, isExecuting: isCreating } = useAction(createSalesReturn);
  const { execute: update, isExecuting: isUpdating } = useAction(updateSalesReturn);
  const [customerList, setCustomerList] = useState<{ name: string; id: string }[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>([]);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);

  const itemFieldKeys: SalesReturnItemField[] = [
    "quantity",
    "unitPrice",
    "subtotal",
    "total",
  ];

  const form = useForm<z.infer<typeof fullSalesReturnSchema>>({
    resolver: zodResolver(fullSalesReturnSchema),
    defaultValues: {
      invoiceNo: salesReturn?.invoiceNo || "",
      customerId: salesReturn?.customerId || "",
      salesReturnDate: salesReturn?.salesReturnDate ? new Date(salesReturn.salesReturnDate) : new Date(),
      grandTotal: salesReturn?.grandTotal || 0,
      salesReturnItem: salesReturn?.salesReturnItem || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "salesReturnItem",
  });

  const year = new Date().getFullYear();


  useEffect(() => {
    const fetchCustomers = async () => {
      const res = await getCustomerListForDropdown();
      const branches = await getAllBranches()
      setBranchList(branches);
      setCustomerList(res);
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const res = await getProductListForDropdown({ query: productSearch });
        setProductOptions(res?.data?.products || []);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  useEffect(() => {
    if (!salesReturn) {
      form.setValue("invoiceNo", `INV-${year}-${nanoid(4).toUpperCase()}`);
    }
  }, [form, salesReturn, year]);

  const handleSubmit = async (data: z.infer<typeof fullSalesReturnSchema>) => {
    const grandTotal = data.salesReturnItem.reduce((sum, item) => sum + (item.total || 0), 0);
    form.setValue("grandTotal", grandTotal);

    const payload = {
      ...data,
      grandTotal,
    };

    try {
      if (salesReturn) {
        await update({ id: salesReturn.id, ...payload });
        toast.success("Sales return updated successfully");
      } else {
        await create(payload);
        toast.success("Sales return created successfully");
        // Reset form for new entry if needed, but we are closing it
        form.reset();
      }
      if (openChange) openChange(false);
    } catch {
      toast.error("Failed to save sales return");
    }
  };

  return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button>New Sales Return</Button>
        </SheetTrigger>
      )}
      <SheetContent side="top" className="max-h-screen overflow-y-auto p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <SheetHeader>
              <SheetTitle>{salesReturn ? "Edit Sales Return" : "New Sales Return"}</SheetTitle>
            </SheetHeader>

            <Card className="grid md:grid-cols-2 gap-4 p-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer</FormLabel>
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
                                    field.onChange(customer.id)
                                    setShowCustomerSuggestions(false)
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
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="salesReturnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Date</FormLabel>
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
                          selected={new Date(field.value)}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            <Card className="p-4 space-y-4">
              <FormItem className="relative max-w-sm">
                <FormLabel>Add Product</FormLabel>
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
                      <CommandInput placeholder="Search product..." value={productSearch} onValueChange={setProductSearch} />
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
                                  product_name: p.product_name,
                                  quantity: 1,
                                  unitPrice: p.sellingPrice || p.purchasePrice,
                                  subtotal: p.sellingPrice || p.purchasePrice,
                                  total: p.sellingPrice || p.purchasePrice,
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
                      <TableCell>
                        {f.product_name || "—"}
                      </TableCell>

                      {itemFieldKeys.map((key) => (
                        <TableCell key={key}>
                          <FormField
                            control={form.control}
                            name={`salesReturnItem.${idx}.${key}`}
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  readOnly={key === "total"}
                                  tabIndex={key === "total" ? -1 : 0}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);

                                    if (key === "quantity" || key === "unitPrice") {
                                      const qty = key === "quantity" ? Number(val) : Number(form.getValues(`salesReturnItem.${idx}.quantity`));
                                      const price = key === "unitPrice" ? Number(val) : Number(form.getValues(`salesReturnItem.${idx}.unitPrice`));

                                      const subtotal = qty * price;
                                      const total = subtotal;

                                      form.setValue(`salesReturnItem.${idx}.subtotal`, subtotal);
                                      form.setValue(`salesReturnItem.${idx}.total`, total);
                                    } else if (key === "subtotal") {
                                      const subtotal = Number(val);
                                      form.setValue(`salesReturnItem.${idx}.total`, subtotal);
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
                      .watch("salesReturnItem")
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
