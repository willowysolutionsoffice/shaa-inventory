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
import { Plus, Layers, Trash2, Pencil, Check, X } from 'lucide-react';
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
import {
  createVariant,
  deleteVariant,
  updateVariant,
  getProductVariants,
  ProductVariant,
} from '@/actions/variant-actions';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useEffect, useRef, useState } from 'react';
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
  id:     string;
  name:   string;
  values: VariationValue[];
}

export interface VariationValue {
  id:    string;
  value: string;
}

interface SubBrandOption {
  id:   string;
  name: string;
}

interface ProductFormProps {
  product?:    Product;
  open?:       boolean;
  openChange?: (open: boolean) => void;
  brands:      { name: string; id: string }[];
  branches:    { name: string; id: string }[];
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const extendedProductSchema = productSchema.extend({
  variationIds: z.array(z.string()).optional().default([]),
  subBrandId:   z.string().optional(),
  categoryId:   z.string().optional(),
  hsl:          z.string().optional(),
});

type FormValues = z.infer<typeof extendedProductSchema>;

// ---------------------------------------------------------------------------
// Local draft variant (before save)
// ---------------------------------------------------------------------------

interface DraftVariant {
  /** client-side temp id */
  _localId:      string;
  /** set once persisted */
  id?:           string;
  variantName:   string;
  sku:           string;
  stock:         number;
  purchasePrice: number;
  sellingPrice:  number;
  /** variationId -> valueId */
  attributes:    Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultValues(product?: Product): FormValues {
  if (!product) {
    return {
      product_name:  '',
      sku:           `SKU-${nanoid(6).toUpperCase()}`,
      branchId:      '',
      unit:          '',
      stock:         0,
      brandId:       '',
      subBrandId:    '',
      categoryId:    '',
      purchasePrice: 0,
      sellingPrice:  0,
      variationIds:  [],
      hsl:           '',
      description:   '',
    };
  }
  return {
    product_name:  product.product_name,
    sku:           product.sku,
    branchId:      product.branchId,
    unit:          product.unit,
    stock:         product.stock,
    brandId:       product.brandId,
    subBrandId:    product.subBrandId    ?? '',
    categoryId:    product.categoryId    ?? product.category?.id ?? '',
    purchasePrice: product.purchasePrice,
    sellingPrice:  product.sellingPrice,
    variationIds:  product.variations?.map((v) => v.variation.id) ?? [],
    hsl:           product.hsl           ?? '',
    description:   product.description   ?? '',
  };
}

function makeDraft(purchasePrice = 0, sellingPrice = 0): DraftVariant {
  return {
    _localId:      nanoid(),
    variantName:   '',
    sku:           `SKU-${nanoid(6).toUpperCase()}`,
    stock:         0,
    purchasePrice,
    sellingPrice,
    attributes:    {},
  };
}

/** Derive a variant name from selected attribute values */
function deriveVariantName(
  attributes: Record<string, string>,
  variations:  Variation[],
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
  draft:        DraftVariant;
  index:        number;
  variations:   Variation[];
  selectedVIds: string[];
  onChange:     (index: number, next: DraftVariant) => void;
  onRemove:     (index: number) => void;
  isSaving:     boolean;
}

function VariantRow({
  draft, index, variations, selectedVIds, onChange, onRemove, isSaving,
}: VariantRowProps) {
  const activeVariations = variations.filter((v) => selectedVIds.includes(v.id));

  const update = (patch: Partial<DraftVariant>) => {
    const next = { ...draft, ...patch };
    // Auto-derive name if not manually overridden
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
            <div key={variation.id}>
              <p className="text-xs text-muted-foreground mb-1">{variation.name}</p>
              <Select
                value={draft.attributes[variation.id] ?? ''}
                onValueChange={(v) => setAttr(variation.id, v)}
              >
                <SelectTrigger className="h-8 text-sm">
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

      {/* Core fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Variant Name</p>
          <Input
            className="h-8 text-sm"
            placeholder="e.g. Red / Large"
            value={draft.variantName}
            onChange={(e) => update({ variantName: e.target.value })}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">SKU</p>
          <Input
            className="h-8 text-sm font-mono"
            placeholder="SKU"
            value={draft.sku}
            onChange={(e) => update({ sku: e.target.value })}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Stock</p>
          <Input
            className="h-8 text-sm"
            type="number"
            placeholder="0"
            value={draft.stock}
            onChange={(e) => update({ stock: Number(e.target.value) })}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Purchase Price (₹)</p>
          <Input
            className="h-8 text-sm"
            type="number"
            placeholder="0"
            value={draft.purchasePrice}
            onChange={(e) => update({ purchasePrice: Number(e.target.value) })}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Selling Price (₹)</p>
          <Input
            className="h-8 text-sm"
            type="number"
            placeholder="0"
            value={draft.sellingPrice}
            onChange={(e) => update({ sellingPrice: Number(e.target.value) })}
          />
        </div>
      </div>
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

  const [internalOpen,    setInternalOpen]    = useState(false);
  const [variations,      setVariations]      = useState<Variation[]>([]);
  const [subBrands,       setSubBrands]       = useState<SubBrandOption[]>([]);
  const [categories,      setCategories]      = useState<CategoryDropdownItem[]>([]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [openBrand,       setOpenBrand]       = useState(false);

  // Variant CRUD state
  const [savedProductId, setSavedProductId] = useState<string | null>(product?.id ?? null);
  const [drafts,         setDrafts]         = useState<DraftVariant[]>([]);
  const [isSavingAll,    setIsSavingAll]     = useState(false);

  const { execute: execCreate, isExecuting: isCreating } = useAction(createProduct);
  const { execute: execUpdate, isExecuting: isUpdating } = useAction(updateProduct);
  const { execute: execCreateVariant } = useAction(createVariant);
  const { execute: execUpdateVariant } = useAction(updateVariant);
  const { execute: execDeleteVariant } = useAction(deleteVariant);

  const form = useForm<FormValues>({
    resolver:      zodResolver(extendedProductSchema),
    defaultValues: buildDefaultValues(product),
  });

  const isOpen              = isControlled ? open : internalOpen;
  const skuValue            = form.watch('sku');
  const brandId             = form.watch('brandId');
  const purchasePrice       = form.watch('purchasePrice');
  const sellingPrice        = form.watch('sellingPrice');
  const selectedVariationIds: string[] = form.watch('variationIds') ?? [];

  // Load variations
  useEffect(() => {
    getVariationList({}).then((result) => {
      setVariations(result?.data?.data ?? []);
    });
  }, []);

  // Load categories
  useEffect(() => {
  getCategoryDropdown().then((result) => {
    setCategories(result ?? []);  // ← result IS the array, not result.data
    setCategoriesReady(true);
  });
}, []);

  // Reset form when sheet opens
  useEffect(() => {
    if (!isOpen || !categoriesReady) return;
    form.reset(buildDefaultValues(product));
    setSavedProductId(product?.id ?? null);
    setDrafts([]);

    // Load existing variants if editing
    if (product?.id) {
      getProductVariants(product.id).then((existing) => {
        const loaded: DraftVariant[] = existing.map((v) => ({
          _localId:      v.id,
          id:            v.id,
          variantName:   v.variantName,
          sku:           v.sku,
          stock:         v.stock,
          purchasePrice: v.purchasePrice,
          sellingPrice:  v.sellingPrice,
          attributes:    Object.fromEntries(
            v.attributes.map((a) => [a.variation.id, a.value.id])
          ),
        }));
        setDrafts(loaded);
      });
    }
  }, [isOpen, categoriesReady]);

  // Load sub-brands when brand changes
  useEffect(() => {
    if (!brandId) {
      setSubBrands([]);
      form.setValue('subBrandId', '');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands/${brandId}/sub-brands?take=200`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((json) => {
        const list: SubBrandOption[] = (json.data ?? []).map((s: any) => ({
          id: s.id, name: s.name,
        }));
        setSubBrands(list);
        const current = form.getValues('subBrandId');
        if (current && !list.find((s) => s.id === current)) {
          form.setValue('subBrandId', '');
        }
      })
      .catch(() => setSubBrands([]));
  }, [brandId]);

  // -------------------------------------------------------------------------
  // Product submit
  // -------------------------------------------------------------------------

  const handleSubmit = async (data: FormValues) => {
    let resultProduct: any = null;

    if (product) {
      const res = await execUpdate({ id: product.id, ...data });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      resultProduct = res?.data?.data;
      toast.success('Product updated');
    } else {
      const res = await execCreate(data);
      if (res?.data?.error) { toast.error(res.data.error); return; }
      resultProduct = res?.data?.data;
      toast.success('Product created');
    }

    const id = resultProduct?.id ?? product?.id ?? null;
    setSavedProductId(id);
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

  // -------------------------------------------------------------------------
  // Variant CRUD
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
      // persisted — delete from backend
      const res = await execDeleteVariant({ id: draft.id });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success('Variant deleted');
    }
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAllVariants = async () => {
    if (!savedProductId) {
      toast.error('Save the product first before saving variants.');
      return;
    }

    const unsaved = drafts.filter((d) => !d.id);
    const updated  = drafts.filter((d) =>  d.id);

    if (unsaved.length === 0 && updated.length === 0) {
      toast.info('Nothing to save.');
      return;
    }

    setIsSavingAll(true);
    let errorCount = 0;

    // Create new
    for (const draft of unsaved) {
      const attributesArr = Object.entries(draft.attributes).map(
        ([variationId, valueId]) => ({ variationId, valueId }),
      );

      if (attributesArr.length === 0 && selectedVariationIds.length > 0) {
        toast.warning(`Variant "${draft.variantName || 'unnamed'}" has no attributes selected — skipped.`);
        errorCount++;
        continue;
      }

      const res = await execCreateVariant({
        productId:     savedProductId,
        sku:           draft.sku,
        variantName:   draft.variantName,
        stock:         draft.stock,
        purchasePrice: draft.purchasePrice,
        sellingPrice:  draft.sellingPrice,
        attributes:    attributesArr,
      });

      if (res?.data?.error) {
        toast.error(`Error creating variant: ${res.data.error}`);
        errorCount++;
      } else if (res?.data?.data) {
        setDrafts((prev) =>
          prev.map((d) =>
            d._localId === draft._localId
              ? { ...d, id: res.data!.data!.id }
              : d,
          ),
        );
      }
    }

    // Update existing
    for (const draft of updated) {
      const res = await execUpdateVariant({
        id:            draft.id!,
        sku:           draft.sku,
        stock:         draft.stock,
        purchasePrice: draft.purchasePrice,
        sellingPrice:  draft.sellingPrice,
      });
      if (res?.data?.error) {
        toast.error(`Error updating variant: ${res.data.error}`);
        errorCount++;
      }
    }

    setIsSavingAll(false);
    if (errorCount === 0) toast.success('All variants saved');
  };

  const closeSheet = () => {
    isControlled ? openChange?.(false) : setInternalOpen(false);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const showVariantSection = selectedVariationIds.length > 0;

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
                Core product fields
            ---------------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:col-span-3">

                <FormField control={form.control} name="product_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input placeholder="Product Name" {...field} /></FormControl>
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
                            variant="outline" role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value
                              ? brands.find((b) => b.id === field.value)?.name
                              : 'Select Brand'}
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
                              {brands.map((brand) => (
                                <CommandItem key={brand.id} value={brand.name}
                                  onSelect={() => { form.setValue('brandId', brand.id); setOpenBrand(false); }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', brand.id === field.value ? 'opacity-100' : 'opacity-0')} />
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

                {subBrands.length > 0 && (
                  <FormField control={form.control} name="subBrandId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Sub-brand <span className="text-muted-foreground text-xs">(optional)</span>
                      </FormLabel>
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select sub-brand" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {subBrands.map((sb) => (
                            <SelectItem key={sb.id} value={sb.id}>{sb.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-muted-foreground text-xs">(optional)</span>
                    </FormLabel>
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
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

                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
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
                      <button type="button" onClick={regenerateSku}
                        className="text-[10px] text-purple-600 hover:text-purple-700 underline font-medium">
                        Regenerate
                      </button>
                    </FormLabel>
                    <FormControl><Input placeholder="Enter SKU" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="hsl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSL Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HSL-001" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock Qty</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>
                      Description <span className="text-muted-foreground text-xs">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Product description..." {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Card>

              {/* QR code panel */}
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
              </Card>
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
                      <label key={variation.id} className={cn(
                        'flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-all duration-150 select-none',
                        isChecked
                          ? 'border-purple-400 bg-purple-50/60 dark:bg-purple-950/20 dark:border-purple-700'
                          : 'border-border bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40',
                      )}>
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm font-medium',
                            isChecked ? 'text-purple-700 dark:text-purple-300' : 'text-foreground',
                          )}>
                            {variation.name}
                          </span>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(c) => toggleVariation(variation.id, !!c)}
                            className={cn('shrink-0',
                              isChecked && 'border-purple-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600',
                            )}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {variation.values.slice(0, 5).map((val) => (
                            <span key={val.id} className={cn(
                              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
                              isChecked
                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                : 'bg-background text-muted-foreground border-border',
                            )}>{val.value}</span>
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
                Variant CRUD — only shown when variations are selected
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

                  <div className="flex items-center gap-2">
                    {!savedProductId && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Save product first to persist variants
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDraft}
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                    </Button>
                    {drafts.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={saveAllVariants}
                        disabled={isSavingAll || !savedProductId}
                      >
                        {isSavingAll ? 'Saving…' : 'Save Variants'}
                      </Button>
                    )}
                  </div>
                </div>

                {drafts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-purple-200 rounded-lg bg-purple-50/30 text-muted-foreground gap-2">
                    <Layers className="h-6 w-6 text-purple-300" />
                    <p className="text-sm">No variants yet. Click <strong>Add Variant</strong> to create one.</p>
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
                <Button type="button" variant="outline" onClick={closeSheet}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving…' : 'Save Product'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};