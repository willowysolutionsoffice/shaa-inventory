"use client";

import { Product } from "@/types/product";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { productSchema } from "@/schemas/product-schema";
import z from "zod";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createProduct, updateProduct } from "@/actions/product-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getBrandlistForDropdown } from "@/actions/brand-actions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"


import { nanoid } from "nanoid";
import { getAllBranches } from "@/actions/auth";

interface ProductFormProps {
  product?: Product;
  open?: boolean;
  openChange?: (open: boolean) => void;
  brands: { name: string; id: string }[];

  branches: { name: string; id: string }[];
}

export const ProductFormSheet = ({ product, open, openChange, brands, branches }: ProductFormProps) => {
  const isControlled = typeof open !== "undefined" && typeof openChange === "function";
  const [internalOpen, setInternalOpen] = useState(false);

  const { execute: createProject, isExecuting: isCreating } = useAction(createProduct);
  const { execute: updateProject, isExecuting: isUpdating } = useAction(updateProduct);

  const [brandList, setBrandList] = useState<{ name: string; id: string }[]>(brands);
  const [openBrand, setOpenBrand] = useState(false);

  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>(branches);

  // Removed useEffect for fetching options as they are now passed as props

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: product?.product_name || "",
      sku: product?.sku || "",
      branchId: product?.branchId || "",
      unit: product?.unit || "",
      stock: product?.stock ?? 0,
      brandId: product?.brandId || "",

      purchasePrice: product?.purchasePrice ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
    },
  });

  const isOpen = isControlled ? open : internalOpen;
  const skuValue = form.watch("sku");

  useEffect(() => {
    if (isOpen) {
      if (!product) {
        form.reset({
          product_name: "",
          sku: `SKU-${nanoid(6).toUpperCase()}`,
          branchId: "",
          unit: "",
          stock: 0,
          brandId: "",

          purchasePrice: 0,
          sellingPrice: 0,
        });
      } else {
        form.reset({
          product_name: product?.product_name || "",
          sku: product?.sku || "",
          branchId: product?.branchId || "",
          unit: product?.unit || "",
          stock: product?.stock ?? 0,
          brandId: product?.brandId || "",

          purchasePrice: product?.purchasePrice ?? undefined,
          sellingPrice: product?.sellingPrice ?? 0,
        });
      }
    }
  }, [form, product, isOpen]);




  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    console.log("Form data submitted:", data);

    if (product) {
      await updateProject({ id: product.id, ...data });
      toast.success("Product updated successfully");

      if (isControlled && openChange) {
        openChange(false);
      } else {
        setInternalOpen(false);
        form.reset();
      }
    } else {
      await createProject(data);
      toast.success("Product created successfully");

      // Reset form for next entry without closing
      form.reset({
        product_name: "",
        sku: `SKU-${nanoid(6).toUpperCase()}`,
        branchId: "",
        unit: "",
        stock: 0,
        brandId: "",

        purchasePrice: 0,
        sellingPrice: 0,
      });
    }
  };

  const regenerateSku = () => {
    form.setValue("sku", `SKU-${nanoid(6).toUpperCase()}`);
    toast.info("Generated new unique SKU");
  };

  return (
    <Sheet
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? openChange : setInternalOpen}
    >
      {!isControlled && (
        <SheetTrigger asChild>
          <Button>
            <Plus className="size-4 mr-2" />
            New Product
          </Button>
        </SheetTrigger>
      )}

      <SheetContent side="top" className="w-full overflow-y-scroll max-h-screen p-5">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <SheetHeader>
              <SheetTitle>{product ? "Edit Product" : "New Product"}</SheetTitle>
              <SheetDescription>Fill out the product details. Click save when done.</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Product Info Card (Left) */}
              <Card className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 lg:col-span-3">
                <div className="md:col-span-2">
                  <FormField control={form.control} name="product_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input placeholder="Product Name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Brand</FormLabel>
                    <Popover open={openBrand} onOpenChange={setOpenBrand}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openBrand}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? brandList.find(
                                 (brand) => brand.id === field.value
                                )?.name
                              : "Select Brand"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search brand..." />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              {brandList.map((brand) => (
                                <CommandItem
                                  value={brand.name}
                                  key={brand.id}
                                  onSelect={() => {
                                    form.setValue("brandId", brand.id)
                                    setOpenBrand(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      brand.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {brand.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

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

                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select Unit" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                        <SelectItem value="pkt">Packets (pkts)</SelectItem>
                        <SelectItem value="box">Boxes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Product SKU</span>
                      <button
                        type="button"
                        onClick={regenerateSku}
                        className="text-[10px] text-purple-600 hover:text-purple-700 underline font-medium flex items-center gap-0.5"
                      >
                        Regenerate
                      </button>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock Qty</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Purchase Price"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Selling Price"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Card>

              {/* QR Code Card (Right) */}
              <Card className="p-4 flex flex-col items-center justify-center border border-dashed border-border/80 bg-muted/10">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Product QR Code
                </span>
                {skuValue ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-border shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(skuValue)}`}
                        alt="SKU QR Code"
                        className="w-[140px] h-[140px] select-none"
                      />
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/50">
                      {skuValue}
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <span className="text-sm">Enter SKU to generate QR Code</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-3 text-center leading-relaxed">
                  Scannable by cameras or barcode hardware in POS billing.
                </p>
              </Card>
            </div>

            <SheetFooter>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};
