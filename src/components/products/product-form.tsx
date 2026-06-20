'use client';

import { Product } from '@/types/product';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { productSchema } from '@/schemas/product-schema';
import z from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Plus, Layers, Trash2, Check } from 'lucide-react';
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { createProduct, updateProduct } from '@/actions/product-actions';
import { getVariationList } from '@/actions/variation-actions';
import { getCategoryDropdown, CategoryDropdownItem } from '@/actions/category-actions';
import { getSubBrandsByBrand } from '@/actions/brand-actions';

import {
  createVariant,
  deleteVariant,
  updateVariant,
  getProductVariants,
} from '@/actions/variant-actions';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Variation {
  id: string;
  name: string;
  values: VariationValue[];
}

export interface VariationValue {
  id: string;
  value: string;
}

interface SubBrandOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: Product;
  open?: boolean;
  openChange?: (open: boolean) => void;
  brands: { name: string; id: string }[];
  branches: { name: string; id: string }[];
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const extendedProductSchema = productSchema.extend({
  variationIds: z.array(z.string()).optional().default([]),
  subBrandId: z.string().min(1, 'Sub-brand is required'),   // ← was .optional()
  categoryId: z.string().min(1, 'Category is required'),    // ← was .optional()
  hsl: z.string().optional(),
});

type FormValues = z.infer<typeof extendedProductSchema>;

// ---------------------------------------------------------------------------
// Local draft variant (before save)
// ---------------------------------------------------------------------------

interface DraftVariant {
  /** client-side temp id */
  _localId: string;
  /** set once persisted */
  id?: string;
  variantName: string;
  sku: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  /** variationId -> valueId */
  attributes: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultValues(product?: Product): FormValues {
  if (!product) {
    return {
      product_name: '',
      sku: `SKU-${nanoid(6).toUpperCase()}`,
      branchId: '',
      unit: '',
      stock: 0,
      brandId: '',
      subBrandId: '',
      categoryId: '',
      purchasePrice: 0,
      sellingPrice: 0,
      variationIds: [],
      hsl: '',
      description: '',
    };
  }
  return {
    product_name: product.product_name,
    sku: product.sku,
    branchId: product.branchId,
    unit: product.unit,
    stock: product.stock,
    brandId: product.brandId,
    subBrandId: product.subBrandId ?? '',
    categoryId: product.categoryId ?? product.category?.id ?? '',
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    variationIds: product.variations?.map((v) => v.variation.id) ?? [],
    hsl: product.hsl ?? '',
    description: product.description ?? '',
  };
}

function makeDraft(purchasePrice = 0, sellingPrice = 0): DraftVariant {
  return {
    _localId: nanoid(),
    variantName: '',
    sku: `SKU-${nanoid(6).toUpperCase()}`,
    stock: 0,
    purchasePrice,
    sellingPrice,
    attributes: {},
  };
}

/** Derive a variant name from selected attribute values */
function deriveVariantName(
  attributes: Record<string, string>,
  variations: Variation[],
): string {
  return variations
    .filter((v) => attributes[v.id])
    .map((v) => {
      const val = v.values.find((vv) => vv.id === attributes[v.id]);
      return val?.value ?? '';
    })
    .filter(Boolean)
    .join(' / ');
}

// ---------------------------------------------------------------------------
// Sub-component: single variant row
// ---------------------------------------------------------------------------

interface VariantRowProps {
  draft: DraftVariant;
  index: number;
  variations: Variation[];
  selectedVIds: string[];
  onChange: (index: number, next: DraftVariant) => void;
  onRemove: (index: number) => void;
  isSaving: boolean;
}

function VariantRow({
  draft, index, variations, selectedVIds, onChange, onRemove, isSaving,
}: VariantRowProps) {
  const activeVariations = variations.filter((v) => selectedVIds.includes(v.id));

  const update = (patch: Partial<DraftVariant>) => {
    const next = { ...draft, ...patch };
    if (!patch.variantName) {
      next.variantName = deriveVariantName(next.attributes, activeVariations);
    }
    onChange(index, next);
  };

  const setAttr = (variationId: string, valueId: string) => {
    const attributes = { ...draft.attributes, [variationId]: valueId };
    const next = { ...draft, attributes };
    next.variantName = deriveVariantName(next.attributes, activeVariations);
    onChange(index, next);
  };

  return (
    <Card className={cn(
      'p-4 border transition-colors',
      draft.id ? 'border-green-200 bg-green-50/20' : 'border-border',
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Variant {index + 1}
          </span>
          {draft.id && (
            <Badge variant="outline" className="text-[10px] border-green-400 text-green-700 bg-green-50">
              Saved
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(index)}
          disabled={isSaving}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Attribute selects */}
      {activeVariations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
          {activeVariations.map((variation) => (
            <div key={variation.id} className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{variation.name}</p>
              <Select
                value={draft.attributes[variation.id] ?? ''}
                onValueChange={(v) => setAttr(variation.id, v)}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder={`Select ${variation.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {variation.values.map((vv) => (
                    <SelectItem key={vv.id} value={vv.id}>{vv.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Core fields — uniform h-9 height, consistent grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Variant Name',
            node: (
              <Input
                className="h-9 text-sm w-full"
                placeholder="e.g. Red / Large"
                value={draft.variantName}
                onChange={(e) => update({ variantName: e.target.value })}
              />
            ),
          },
          {
            label: 'SKU',
            node: (
              <Input
                className="h-9 text-sm font-mono w-full"
                placeholder="SKU"
                value={draft.sku}
                onChange={(e) => update({ sku: e.target.value })}
              />
            ),
          },
          {
            label: 'Stock',
            node: (
              <Input
                className="h-9 text-sm w-full"
                type="number"
                placeholder="0"
                value={draft.stock}
                onChange={(e) => update({ stock: Number(e.target.value) })}
              />
            ),
          },
          {
            label: 'Purchase Price (₹)',
            node: (
              <Input
                className="h-9 text-sm w-full"
                type="number"
                placeholder="0"
                value={draft.purchasePrice}
                onChange={(e) => update({ purchasePrice: Number(e.target.value) })}
              />
            ),
          },
          {
            label: 'Selling Price (₹)',
            node: (
              <Input
                className="h-9 text-sm w-full"
                type="number"
                placeholder="0"
                value={draft.sellingPrice}
                onChange={(e) => update({ sellingPrice: Number(e.target.value) })}
              />
            ),
          },
        ].map(({ label, node }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {node}
          </div>
        ))}
      </div>
    </Card>
  );
}
function BarcodePanel({ sku }: { sku: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!sku || !svgRef.current) return;
    import("jsbarcode").then((mod) => {
      const JsBarcode = mod.default;
      JsBarcode(svgRef.current, sku, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 11,
        margin: 6,
        background: "#ffffff",
        lineColor: "#000000",
      });
    });
  }, [sku]);

  return (
    <Card className="p-4 flex flex-col items-center justify-center border border-dashed border-border/80 bg-muted/10">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Product Barcode
      </span>
      {sku ? (
        <div className="flex flex-col items-center gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-border shadow-sm">
            <svg ref={svgRef} />
          </div>
          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/50">
            {sku}
          </span>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <span className="text-sm">Enter SKU to generate barcode</span>
        </div>
      )}
    </Card>
  );
}
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const ProductFormSheet = ({
  product, open, openChange, brands, branches,
}: ProductFormProps) => {
  const isControlled = typeof open !== 'undefined' && typeof openChange === 'function';

  const [internalOpen, setInternalOpen] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [subBrands, setSubBrands] = useState<SubBrandOption[]>([]);
  const [subBrandsLoading, setSubBrandsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);

  // Variant CRUD state
  const [savedProductId, setSavedProductId] = useState<string | null>(product?.id ?? null);
  const [drafts, setDrafts] = useState<DraftVariant[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  // Track whether we've already loaded variants for the current edit session
  const variantsLoadedRef = useRef(false);

  // Submission state — replaces useAction hooks; we call server actions directly
  // so that async results are available immediately in handleSubmit.
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(extendedProductSchema),
    defaultValues: buildDefaultValues(product),
  });

  const isOpen = isControlled ? open : internalOpen;
  const skuValue = form.watch('sku');
  const brandId = form.watch('brandId');
  const purchasePrice = form.watch('purchasePrice');
  const sellingPrice = form.watch('sellingPrice');
  const selectedVariationIds: string[] = form.watch('variationIds') ?? [];

  // Load variations once on mount
  useEffect(() => {
    getVariationList({}).then((result) => {
      setVariations(result?.data?.data ?? []);
    });
  }, []);

  // Load categories once on mount
  useEffect(() => {
    getCategoryDropdown().then((result) => {
      setCategories(result ?? []);
      setCategoriesReady(true);
    });
  }, []);

  // -------------------------------------------------------------------------
  // FIX 3: Load existing variants when editing
  // Separated from the main reset effect so it runs independently and is not
  // gated on `categoriesReady`, which was causing it to be skipped on edit.
  // -------------------------------------------------------------------------
  const loadVariantsForProduct = useCallback(async (productId: string) => {
    if (variantsLoadedRef.current) return;
    variantsLoadedRef.current = true;
    try {
      const existing = await getProductVariants(productId);
      const loaded: DraftVariant[] = existing.map((v) => ({
        _localId: v.id,
        id: v.id,
        variantName: v.variantName,
        sku: v.sku,
        stock: v.stock,
        purchasePrice: v.purchasePrice,
        sellingPrice: v.sellingPrice,
        attributes: Object.fromEntries(
          v.attributes.map((a) => [a.variation.id, a.value.id])
        ),
      }));
      setDrafts(loaded);
    } catch (err) {
      toast.error('Failed to load existing variants.');
    }
  }, []);

  // Reset form + drafts when sheet opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset draft-load guard so we re-fetch on each open
    variantsLoadedRef.current = false;

    form.reset(buildDefaultValues(product));
    setSavedProductId(product?.id ?? null);
    setDrafts([]);

    if (product?.id) {
      loadVariantsForProduct(product.id);
    }
  }, [isOpen]); // intentionally only on open toggle; form/product are stable refs

  // -------------------------------------------------------------------------
  // FIX 1: Sub-brand loading — Safari/macOS compatible
  // Replaced the `fetch` call with a more robust pattern:
  //  - Uses a stable base URL fallback
  //  - Sets explicit headers that Safari requires for credentialed cross-origin
  //  - Guards against stale responses with an AbortController
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!brandId) {
      setSubBrands([]);
      form.setValue('subBrandId', '');
      return;
    }

    let cancelled = false;
    setSubBrandsLoading(true);

    getSubBrandsByBrand(brandId)
      .then((list) => {
        if (cancelled) return;
        setSubBrands(list);
        const current = form.getValues('subBrandId');
        if (current && !list.find((s) => s.id === current)) {
          form.setValue('subBrandId', '');
        }
      })
      .catch(() => { if (!cancelled) setSubBrands([]); })
      .finally(() => { if (!cancelled) setSubBrandsLoading(false); });

    return () => { cancelled = true; };
  }, [brandId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Variant helpers (no standalone save — variants are saved inside handleSubmit)
  // -------------------------------------------------------------------------

  const addDraft = () => {
    setDrafts((prev) => [
      ...prev,
      makeDraft(Number(purchasePrice), Number(sellingPrice)),
    ]);
  };

  const updateDraft = (index: number, next: DraftVariant) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? next : d)));
  };

  const removeDraft = async (index: number) => {
    const draft = drafts[index];
    if (draft.id) {
      try {
        const res = await deleteVariant({ id: draft.id });
        if (res?.data?.error) { toast.error(res.data.error); return; }
        toast.success('Variant removed');
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to delete variant');
        return;
      }
    }
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Persist all draft variants against a known productId.
   * Calls server actions directly (not via useAction hook) so results are
   * available synchronously in the async flow.
   * Returns true if all variants saved without error.
   */
  const persistVariants = async (productId: string): Promise<boolean> => {
    const unsaved = drafts.filter((d) => !d.id);
    const toUpdate = drafts.filter((d) => !!d.id);
    let errorCount = 0;

    // Create new variants
    for (const draft of unsaved) {
      const attributesArr = Object.entries(draft.attributes).map(
        ([variationId, valueId]) => ({ variationId, valueId }),
      );

      // Skip drafts that have no attributes when variations are selected
      if (attributesArr.length === 0 && selectedVariationIds.length > 0) {
        toast.warning(
          `Variant "${draft.variantName || 'unnamed'}" has no attributes selected — skipped.`,
        );
        errorCount++;
        continue;
      }

      try {
        const res = await createVariant({
          productId,
          sku: draft.sku,
          variantName: draft.variantName,
          stock: draft.stock,
          purchasePrice: draft.purchasePrice,
          sellingPrice: draft.sellingPrice,
          attributes: attributesArr,
        });

        if (res?.data?.error) {
          toast.error(`Variant error: ${res.data.error}`);
          errorCount++;
        } else if (res?.data?.data) {
          const newId = res.data.data.id;
          setDrafts((prev) =>
            prev.map((d) =>
              d._localId === draft._localId ? { ...d, id: newId } : d,
            ),
          );
        }
      } catch (err: any) {
        toast.error(`Variant error: ${err?.message ?? 'Unknown error'}`);
        errorCount++;
      }
    }

    // Update existing variants
    for (const draft of toUpdate) {
      try {
        const res = await updateVariant({
          id: draft.id!,
          sku: draft.sku,
          stock: draft.stock,
          purchasePrice: draft.purchasePrice,
          sellingPrice: draft.sellingPrice,
        });
        if (res?.data?.error) {
          toast.error(`Variant update error: ${res.data.error}`);
          errorCount++;
        }
      } catch (err: any) {
        toast.error(`Variant update error: ${err?.message ?? 'Unknown error'}`);
        errorCount++;
      }
    }

    return errorCount === 0;
  };

  // -------------------------------------------------------------------------
  // Product submit — calls server actions directly so we get real return values.
  // useAction's execute() is fire-and-forget and returns undefined, which was
  // the cause of "Could not determine product ID".
  // -------------------------------------------------------------------------

  const handleSubmit = async (data: FormValues) => {
    setIsSavingAll(true);

    try {
      let productId: string | null = null;

      // 1. Save the product (call action directly, not via useAction hook)
      if (product) {
        setIsUpdating(true);
        try {
          const res = await updateProduct({ id: product.id, ...data });
          if (res?.data?.error) { toast.error(res.data.error); return; }
          // updateProduct returns { data: normalizeProduct(...) }
          productId = (res?.data as any)?.data?.id ?? product.id;
        } finally {
          setIsUpdating(false);
        }
      } else {
        setIsCreating(true);
        try {
          const res = await createProduct(data);
          if (res?.data?.error) { toast.error(res.data.error); return; }
          // createProduct returns { data: normalizeProduct(...) }
          productId = (res?.data as any)?.data?.id ?? null;
        } finally {
          setIsCreating(false);
        }
      }

      if (!productId) {
        toast.error('Product saved but ID was not returned — variants not saved.');
        return;
      }

      setSavedProductId(productId);

      // 2. Save all variants (new + updated) against the productId
      if (drafts.length > 0) {
        const variantsOk = await persistVariants(productId);
        if (!variantsOk) {
          toast.warning(
            product
              ? 'Product updated, but some variants had errors. Please review.'
              : 'Product created, but some variants had errors. Please review.',
          );
          return;
        }
      }

      // 3. Everything succeeded — show toast and close
      toast.success(product ? 'Product updated successfully.' : 'Product created successfully.');
      closeSheet();
    } finally {
      setIsSavingAll(false);
    }
  };

  const regenerateSku = () => {
    form.setValue('sku', `SKU-${nanoid(6).toUpperCase()}`);
    toast.info('Generated new SKU');
  };

  const toggleVariation = (id: string, checked: boolean) => {
    const current = form.getValues('variationIds') ?? [];
    form.setValue(
      'variationIds',
      checked ? [...current, id] : current.filter((v) => v !== id),
      { shouldValidate: true },
    );
  };

  const closeSheet = () => {
    isControlled ? openChange?.(false) : setInternalOpen(false);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const showVariantSection = selectedVariationIds.length > 0;

  // Shared class for uniform field height across all controls
  const fieldH = 'h-9';

  return (
    <Sheet
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? openChange : setInternalOpen}
    >
      {!isControlled && (
        <SheetTrigger asChild>
          <Button><Plus className="size-4 mr-2" />New Product</Button>
        </SheetTrigger>
      )}

      <SheetContent side="top" className="w-full overflow-y-scroll max-h-screen p-5">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <SheetHeader>
              <SheetTitle>{product ? 'Edit Product' : 'New Product'}</SheetTitle>
              <SheetDescription>
                Fill out the product details. Click save when done.
              </SheetDescription>
            </SheetHeader>

            {/* ----------------------------------------------------------------
                FIX 2: Core product fields — uniform heights + consistent grid
            ---------------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/*
                All FormItem children use the same `fieldH` (h-9) on their
                control element so every row has identical heights whether it
                renders an Input, Select, or Button (combobox trigger).
              */}
              <Card className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5 lg:col-span-3">

                {/* Product Name */}
                <FormField control={form.control} name="product_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input className={fieldH} placeholder="Product Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Brand combobox */}
                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Brand</FormLabel>
                    <Popover open={openBrand} onOpenChange={setOpenBrand}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            type="button"
                            className={cn(
                              'w-full justify-between font-normal',
                              fieldH,
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? brands.find((b) => b.id === field.value)?.name
                              : 'Select Brand'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-0">
                        <Command>
                          <CommandInput placeholder="Search brand..." />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  value={brand.name}
                                  onSelect={() => {
                                    form.setValue('brandId', brand.id);
                                    setOpenBrand(false);
                                  }}
                                >
                                  <Check className={cn(
                                    'mr-2 h-4 w-4',
                                    brand.id === field.value ? 'opacity-100' : 'opacity-0',
                                  )} />
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

                {/* Sub-brand — always renders the slot; shows loader/disabled while fetching */}
                <FormField control={form.control} name="subBrandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-brand</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={!brandId || subBrandsLoading || subBrands.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(fieldH, 'w-full')}>
                          <SelectValue
                            placeholder={
                              !brandId
                                ? 'Select a brand first'
                                : subBrandsLoading
                                  ? 'Loading…'
                                  : subBrands.length === 0
                                    ? 'No sub-brands available'
                                    : 'Select sub-brand'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subBrands.map((sb) => (
                          <SelectItem key={sb.id} value={sb.id}>{sb.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(fieldH, 'w-full')}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Business Location */}
                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(fieldH, 'w-full')}>
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Unit */}
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(fieldH, 'w-full')}>
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
                )} />

                {/* SKU */}
                <FormField control={form.control} name="sku" render={({ field }) => (
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
                      <Input className={cn(fieldH, 'font-mono')} placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* HSL Code */}
                <FormField control={form.control} name="hsl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSL Code</FormLabel>
                    <FormControl>
                      <Input
                        className={fieldH}
                        placeholder="e.g. HSL-001"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Stock */}
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock Qty</FormLabel>
                    <FormControl>
                      <Input
                        className={fieldH}
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Purchase Price */}
                <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        className={fieldH}
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Selling Price */}
                <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        className={fieldH}
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Description — full width */}
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>
                      Description{' '}
                      <span className="text-muted-foreground text-xs">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={fieldH}
                        placeholder="Product description…"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Card>

              {/* Bar code panel */}
              {/* Barcode panel */}
<BarcodePanel sku={skuValue} />
            </div>

            {/* ----------------------------------------------------------------
                Variation selection
            ---------------------------------------------------------------- */}
            {variations.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Product Variations</span>
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
                          'flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-all duration-150 select-none',
                          isChecked
                            ? 'border-purple-400 bg-purple-50/60 dark:bg-purple-950/20 dark:border-purple-700'
                            : 'border-border bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            'text-sm font-medium',
                            isChecked ? 'text-purple-700 dark:text-purple-300' : 'text-foreground',
                          )}>
                            {variation.name}
                          </span>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(c) => toggleVariation(variation.id, !!c)}
                            className={cn(
                              'shrink-0',
                              isChecked && 'border-purple-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600',
                            )}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {variation.values.slice(0, 5).map((val) => (
                            <span
                              key={val.id}
                              className={cn(
                                'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
                                isChecked
                                  ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                  : 'bg-background text-muted-foreground border-border',
                              )}
                            >
                              {val.value}
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

            {/* ----------------------------------------------------------------
                Variant CRUD
            ---------------------------------------------------------------- */}
            {showVariantSection && (
              <Card className="p-4 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold">Variants</span>
                    {drafts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {drafts.filter((d) => d.id).length}/{drafts.length} saved
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraft}
                    className="h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                  </Button>
                </div>

                {drafts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-purple-200 rounded-lg bg-purple-50/30 text-muted-foreground gap-2">
                    <Layers className="h-6 w-6 text-purple-300" />
                    <p className="text-sm">
                      No variants yet. Click <strong>Add Variant</strong> to create one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((draft, index) => (
                      <VariantRow
                        key={draft._localId}
                        draft={draft}
                        index={index}
                        variations={variations}
                        selectedVIds={selectedVariationIds}
                        onChange={updateDraft}
                        onRemove={removeDraft}
                        isSaving={isSavingAll}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ----------------------------------------------------------------
                Footer
            ---------------------------------------------------------------- */}
            <SheetFooter>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSheet}
                  disabled={isSavingAll}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating || isSavingAll}>
                  {isSavingAll || isCreating || isUpdating
                    ? 'Saving…'
                    : product
                      ? 'Update Product'
                      : 'Create Product'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};