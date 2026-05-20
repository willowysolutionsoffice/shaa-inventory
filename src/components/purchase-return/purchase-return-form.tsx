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
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { fullPurchaseReturnSchema } from "@/schemas/purchase-return-item-schema";
import { createPurchaseReturn, updatePurchaseReturn } from "@/actions/purchase-return-action";
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
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { z } from "zod";
import { ProductOption } from "@/types/product";
import { PurchaseReturnFormProps, PurchaseReturnItemField } from "@/types/purchase-return";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn, CURRENCY_SYMBOL, formatDate } from "@/lib/utils";
import { nanoid } from "nanoid";
import { getAllBranches } from "@/actions/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>([]);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);

  const itemFieldKeys: PurchaseReturnItemField[] = [
    "quantity",
    "unitPrice",
    "subtotal",
    "total",
  ];

  useEffect(() => {
    const fetchSuppliers = async () => {
      const res = await getSupplierListForDropdown();
      const branches = await getAllBranches()
      setBranchList(branches);
      setSupplierList(res);
    };
    fetchSuppliers();
  }, []);

  const form = useForm<z.infer<typeof fullPurchaseReturnSchema>>({
    resolver: zodResolver(fullPurchaseReturnSchema),
    defaultValues: {
      referenceNo: purchaseReturn?.referenceNo || "",
      branchId: purchaseReturn?.branchId || "",
      supplierId: purchaseReturn?.supplierId || "",
      returnDate: purchaseReturn?.returnDate ? new Date(purchaseReturn.returnDate) : new Date(),
      totalAmount: purchaseReturn?.totalAmount || 0,
      purchaseReturnItem: purchaseReturn?.purchaseReturnItem || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "purchaseReturnItem",
  });

  useEffect(() => {
    if (!purchaseReturn) {
      form.setValue("referenceNo", `REF-${nanoid(4).toUpperCase()}`);
    }
  }, [form, purchaseReturn]);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (productSearch.length > 1) {
        const res = await getProductListForDropdown({ query: productSearch });
        setProductOptions(res?.data?.products || []);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  const handleSubmit = async (data: z.infer<typeof fullPurchaseReturnSchema>) => {
    const totalAmount = data.purchaseReturnItem.reduce((sum, item) => sum + (item.total || 0), 0);
    form.setValue("totalAmount", totalAmount);

    const payload = {
      ...data,
      totalAmount,
    };

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
              <SheetTitle>{purchaseReturn ? "Edit Purchase Return" : "New Purchase Return"}</SheetTitle>
            </SheetHeader>

            <Card className="grid md:grid-cols-2 gap-4 p-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Supplier</FormLabel>
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
                            name={`purchaseReturnItem.${idx}.${key}`}
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  readOnly={key === "total"}
                                  tabIndex={key === "total" ? -1 : 0}
                                  value={
                                    (field.value === undefined || field.value === null || Number.isNaN(field.value))
                                      ? ""
                                      : field.value
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);

                                    if (key === "quantity" || key === "unitPrice") {
                                      const qty = key === "quantity" ? Number(val) : Number(form.getValues(`purchaseReturnItem.${idx}.quantity`));
                                      const unitPrice = key === "unitPrice" ? Number(val) : Number(form.getValues(`purchaseReturnItem.${idx}.unitPrice`));

                                      const subtotal = qty * unitPrice;
                                      const total = subtotal;

                                      form.setValue(`purchaseReturnItem.${idx}.subtotal`, subtotal);
                                      form.setValue(`purchaseReturnItem.${idx}.total`, total);
                                    } else if (key === "subtotal") {
                                      const subtotal = Number(val);
                                      form.setValue(`purchaseReturnItem.${idx}.total`, subtotal);
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
