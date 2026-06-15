"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { updateProductStock } from "@/actions/stock-actions";
import {
  adjustVariantStock,
  getProductVariants,
  ProductVariant,
} from "@/actions/variant-actions";
import { toast } from "sonner";
import { Check, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

// ── Single variant row ─────────────────────────────────────────────────────────

function VariantStockRow({ variant }: { variant: ProductVariant }) {
  const [stock,   setStock]   = useState<number>(variant.stock);
  const [isDirty, setIsDirty] = useState(false);
  
  const { execute, isExecuting, result } = useAction(adjustVariantStock, {
    onSuccess: ({ data }) => {
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(`${variant.variantName} updated`);
      setIsDirty(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Failed to update variant stock');
    },
  });

  const handle = () => {
    execute({ id: variant.id, stock });
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{variant.variantName}</p>
        <p className="text-[10px] font-mono text-muted-foreground truncate">{variant.sku}</p>
      </div>
      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
        {variant.stock}
      </Badge>
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="number"
          value={stock}
          onChange={(e) => {
            const val = Number(e.target.value);
            setStock(val);
            setIsDirty(val !== variant.stock);
          }}
          className="w-20 h-7 text-xs"
        />
        {isDirty && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 text-green-600 border-green-200 hover:bg-green-50"
            onClick={handle}
            disabled={isExecuting}
          >
            {isExecuting
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <Check className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main cell ──────────────────────────────────────────────────────────────────

interface ProductStockUpdateCellProps {
  product: Product;
}

export const ProductStockUpdateCell = ({ product }: ProductStockUpdateCellProps) => {
  const [stock,    setStock]    = useState<number>(product.stock);
  const [isDirty,  setIsDirty]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loaded,   setLoaded]   = useState(false);
  const [loading,  setLoading]  = useState(false);

 const { execute, isExecuting } = useAction(updateProductStock, {
  onSuccess: ({ data }) => {
    if (data?.error) {
      toast.error(data.error);
      return;
    }
    toast.success(`Stock updated for ${product.product_name}`);
    setIsDirty(false);
  },
  onError: ({ error }) => {
    toast.error(error.serverError ?? 'Failed to update stock');
  },
});

const handleUpdate = () => {
  execute({ id: product.id, stock });
};

  const hasVariants = (product.variations?.length ?? 0) > 0;

  const loadVariants = async () => {
    if (loaded) {
      setExpanded((prev) => !prev);
      return;
    }
    setLoading(true);
    const v = await getProductVariants(product.id);
    setVariants(v);
    setLoaded(true);
    setLoading(false);
    if (v.length > 0) setExpanded(true);
  };

  

  // Variant-based product
  if (hasVariants) {
    return (
      <div className="flex flex-col gap-1 w-full min-w-[280px]">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground justify-start gap-1.5 px-2 w-fit"
          onClick={loadVariants}
          disabled={loading}
        >
          {loading
            ? <RefreshCw className="h-3 w-3 animate-spin" />
            : expanded
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />}
          {loaded
            ? variants.length > 0
              ? `${variants.length} variants`
              : "No variants generated yet"
            : "View variants"}
        </Button>

        {expanded && variants.length > 0 && (
          <div className="border border-border rounded-lg bg-muted/10 overflow-hidden">
            {variants.map((v) => (
              <VariantStockRow key={v.id} variant={v} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Simple product — direct stock update
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={stock}
        onChange={(e) => {
          const val = Number(e.target.value);
          setStock(val);
          setIsDirty(val !== product.stock);
        }}
        className="w-24 h-8"
      />
      {isDirty && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
          onClick={handleUpdate}
          disabled={isExecuting}
        >
          {isExecuting
            ? <RefreshCw className="h-4 w-4 animate-spin" />
            : <Check className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
};