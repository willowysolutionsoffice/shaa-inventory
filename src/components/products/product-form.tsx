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
import { useForm, FormProvider } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createProduct, updateProduct } from "@/actions/product-actions";
import { getVariationListForForm } from "@/actions/variation-actions";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Variation {
  id: string;
  name: string;
  values: string[];
}

interface ProductFormProps {
  product?: Product;
  open?: boolean;
  openChange?: (open: boolean) => void;
  brands: { name: string; id: string }[];
  branches: { name: string; id: string }[];
}

const extendedProductSchema = productSchema.extend({
  variationIds: z.array(z.string()).optional().default([]),
});

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductFormSheet = ({
  product,
  open,
  openChange,
  brands,
  branches,
}: ProductFormProps) => {
  const isControlled =
    typeof open !== "undefined" && typeof openChange === "function";
  const [internalOpen, setInternalOpen] = useState(false);

  // Variations fetched client-side — no prop needed
  const [variations, setVariations] = useState<Variation[]>([]);

  const { execute: createProject, isExecuting: isCreating } =
    useAction(createProduct);
  const { execute: updateProject, isExecuting: isUpdating } =
    useAction(updateProduct);

  const [brandList] = useState<{ name: string; id: string }[]>(brands);
  const [branchList] = useState<{ name: string; id: string }[]>(branches);
  const [openBrand, setOpenBrand] = useState(false);

  const form = useForm<z.infer<typeof extendedProductSchema>>({
    resolver: zodResolver(extendedProductSchema),
    defaultValues: {
      product_name: product?.product_name || "",
      sku: product?.sku || "",
      branchId: product?.branchId || "",
      unit: product?.unit || "",
      stock: product?.stock ?? 0,
      brandId: product?.brandId || "",
      purchasePrice: product?.purchasePrice ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      variationIds: (product as any)?.variationIds ?? [],
    },
  });

  const isOpen = isControlled ? open : internalOpen;
  const skuValue = form.watch("sku");
  const selectedVariationIds: string[] = form.watch("variationIds") ?? [];

  // Fetch variations once on mount
  useEffect(() => {
    getVariationListForForm({}).then((result) => {
      const data = result?.data?.data ?? [];
      setVariations(data);
    });
  }, []);

  // Reset form when sheet opens/closes
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
          variationIds: [],
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
          variationIds: (product as any)?.variationIds ?? [],
        });
      }
    }
  }, [form, product, isOpen]);

  const handleSubmit = async (data: z.infer<typeof extendedProductSchema>) => {
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
      form.reset({
        product_name: "",
        sku: `SKU-${nanoid(6).toUpperCase()}`,
        branchId: "",
        unit: "",
        stock: 0,
        brandId: "",
        purchasePrice: 0,
        sellingPrice: 0,
        variationIds: [],
      });
    }
  };

  const regenerateSku = () => {
    form.setValue("sku", `SKU-${nanoid(6).toUpperCase()}`);
    toast.info("Generated new unique SKU");
  };

  const toggleVariation = (id: string, checked: boolean) => {
    const current = form.getValues("variationIds") ?? [];
    const next = checked ? [...current, id] : current.filter((v) => v !== id);
    form.setValue("variationIds", next, { shouldValidate: true });
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

      <SheetContent
        side="top"
        className="w-full overflow-y-scroll max-h-screen p-5"
      >
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <SheetHeader>
              <SheetTitle>{product ? "Edit Product" : "New Product"}</SheetTitle>
              <SheetDescription>
                Fill out the product details. Click save when done.
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* ── Product Info Card ─────────────────────────────────── */}
              <Card className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:col-span-3">
                <FormField
                  control={form.control}
                  name="product_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand combobox */}
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
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
                                ? brandList.find((b) => b.id === field.value)?.name
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
                                      form.setValue("brandId", brand.id);
                                      setOpenBrand(false);
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

                {/* Unit */}
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                          <SelectItem value="pkt">Packets (pkts)</SelectItem>
                          <SelectItem value="box">Boxes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SKU */}
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Product SKU</span>
                        <button
                          type="button"
                          onClick={regenerateSku}
                          className="text-[10px] text-purple-600 hover:text-purple-700 underline font-medium"
                        >
                          Regenerate
                        </button>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stock */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
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
                  )}
                />

                {/* Purchase Price */}
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
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
                  )}
                />

                {/* Selling Price */}
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
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
                  )}
                />
              </Card>

              {/* ── QR Code Card ──────────────────────────────────────── */}
              <Card className="p-4 flex flex-col items-center justify-center border border-dashed border-border/80 bg-muted/10">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Product QR Code
                </span>
                {skuValue ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-border shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          skuValue
                        )}`}
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

            {/* ── Variations Card ───────────────────────────────────────── */}
            {variations.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Product Variations</span>
                  <span className="text-xs text-muted-foreground">
                    — select which variations apply to this product
                  </span>
                  {selectedVariationIds.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {selectedVariationIds.length} selected
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {variations.map((variation) => {
                    const isChecked = selectedVariationIds.includes(variation.id);
                    return (
                      <label
                        key={variation.id}
                        className={cn(
                          "flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-all duration-150 select-none",
                          isChecked
                            ? "border-purple-400 bg-purple-50/60 dark:bg-purple-950/20 dark:border-purple-700"
                            : "border-border bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-sm font-medium leading-none",
                              isChecked
                                ? "text-purple-700 dark:text-purple-300"
                                : "text-foreground"
                            )}
                          >
                            {variation.name}
                          </span>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              toggleVariation(variation.id, !!checked)
                            }
                            className={cn(
                              "shrink-0",
                              isChecked &&
                                "border-purple-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            )}
                          />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {variation.values.slice(0, 5).map((val) => (
                            <span
                              key={val}
                              className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border",
                                isChecked
                                  ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                                  : "bg-background text-muted-foreground border-border"
                              )}
                            >
                              {val}
                            </span>
                          ))}
                          {variation.values.length > 5 && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border bg-background">
                              +{variation.values.length - 5} more
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Card>
            )}

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