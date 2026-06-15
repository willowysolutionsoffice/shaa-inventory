"use client";

import { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  RefreshCw, Trash2, Zap, PackageOpen, Check, Pencil, X, Layers,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import {
  generateVariants,
  getProductVariants,
  updateVariant,
  deleteVariant,
  type ProductVariant,
} from "@/actions/variant-actions";

interface VariantManagerPanelProps {
  productId: string;
  productSku: string;
  /** Variation IDs currently assigned to this product */
  variationIds: string[];
  purchasePrice: number;
  sellingPrice: number;
}

// ── Inline editable variant row ───────────────────────────────────────────────

interface VariantRowProps {
  variant: ProductVariant;
  onDeleted: () => void;
  onUpdated: (v: ProductVariant) => void;
}

function VariantRow({ variant, onDeleted, onUpdated }: VariantRowProps) {
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(variant.stock);
  const [purchasePrice, setPurchasePrice] = useState(variant.purchasePrice);
  const [sellingPrice, setSellingPrice] = useState(variant.sellingPrice);
  const [sku, setSku] = useState(variant.sku);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { execute: execUpdate, isExecuting: isUpdating } = useAction(updateVariant);
  const { execute: execDelete, isExecuting: isDeleting } = useAction(deleteVariant);

  const handleSave = async () => {
    const result = await execUpdate({ id: variant.id, stock, purchasePrice, sellingPrice, sku });
    if (result?.data?.data) {
      onUpdated(result.data.data);
      setEditing(false);
      toast.success(`${variant.variantName} updated`);
    } else {
      toast.error(result?.data?.error ?? "Failed to update variant");
    }
  };

  const handleDelete = async () => {
    const result = await execDelete({ id: variant.id });
    if (result?.data?.data?.success) {
      onDeleted();
      toast.success(`${variant.variantName} deleted`);
    } else {
      toast.error("Failed to delete variant");
    }
    setConfirmDelete(false);
  };

  const handleCancel = () => {
    setStock(variant.stock);
    setPurchasePrice(variant.purchasePrice);
    setSellingPrice(variant.sellingPrice);
    setSku(variant.sku);
    setEditing(false);
  };

  return (
    <>
      <TableRow className="group">
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {variant.attributes.map((attr) => (
              <Badge key={attr.variation.id} variant="secondary" className="text-[10px]">
                {attr.variation.name}: {attr.value.value}
              </Badge>
            ))}
          </div>
          <p className="text-xs font-medium mt-1">{variant.variantName}</p>
        </TableCell>

        <TableCell>
          {editing ? (
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="h-7 w-32 font-mono text-xs"
            />
          ) : (
            <span className="font-mono text-xs text-muted-foreground">{variant.sku}</span>
          )}
        </TableCell>

        <TableCell className="text-center">
          {editing ? (
            <Input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="h-7 w-20 text-center text-xs"
            />
          ) : (
            <Badge variant="outline" className="font-mono">
              {variant.stock}
            </Badge>
          )}
        </TableCell>

        <TableCell className="text-right">
          {editing ? (
            <Input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="h-7 w-24 text-right text-xs"
            />
          ) : (
            <span className="text-xs">₹{variant.purchasePrice.toFixed(2)}</span>
          )}
        </TableCell>

        <TableCell className="text-right">
          {editing ? (
            <Input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="h-7 w-24 text-right text-xs"
            />
          ) : (
            <span className="text-xs">₹{variant.sellingPrice.toFixed(2)}</span>
          )}
        </TableCell>

        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="h-7 w-7 p-0 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={handleCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{variant.variantName}</span>{" "}
              (SKU: {variant.sku}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

export function VariantManagerPanel({
  productId,
  productSku,
  variationIds,
  purchasePrice,
  sellingPrice,
}: VariantManagerPanelProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const { execute: execGenerate, isExecuting: isGenerating } = useAction(generateVariants);

  const load = async () => {
    setLoading(true);
    const v = await getProductVariants(productId);
    setVariants(v);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleGenerate = async () => {
    setConfirmGenerate(false);
    const result = await execGenerate({
      productId,
      variationIds,
      purchasePrice,
      sellingPrice,
    });
    if (result?.data?.data) {
      setVariants(result.data.data);
      toast.success(`${result.data.data.length} variants generated`);
    } else {
      toast.error(result?.data?.error ?? "Failed to generate variants");
    }
  };

  const handleDeleted = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdated = (updated: ProductVariant) => {
    setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Variants</span>
            {variants.length > 0 && <Badge variant="secondary">{variants.length}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            SKU: <span className="font-mono">{productSku}</span> · Total stock:{" "}
            <span className="font-semibold">{totalStock}</span>
          </p>
        </div>

        {variationIds.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
            onClick={() =>
              variants.length > 0 ? setConfirmGenerate(true) : handleGenerate()
            }
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {variants.length > 0 ? "Regenerate Variants" : "Generate Variants"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <RefreshCw className="h-6 w-6 animate-spin opacity-40" />
          <span className="text-sm">Loading variants...</span>
        </div>
      ) : variants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <PackageOpen className="h-10 w-10 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium">No variants yet</p>
            <p className="text-xs mt-1">
              {variationIds.length > 0
                ? "Click Generate Variants to create all combinations from the assigned variations."
                : "Assign variations above first, then generate variants."}
            </p>
          </div>
          {variationIds.length > 0 && (
            <Button type="button" size="sm" onClick={handleGenerate} disabled={isGenerating}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Generate Variants
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right">Purchase ₹</TableHead>
                <TableHead className="text-right">Selling ₹</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <VariantRow
                  key={v.id}
                  variant={v}
                  onDeleted={() => handleDeleted(v.id)}
                  onUpdated={handleUpdated}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Regenerate confirmation */}
      <AlertDialog open={confirmGenerate} onOpenChange={setConfirmGenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate variants?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all{" "}
              <span className="font-semibold text-foreground">{variants.length}</span>{" "}
              existing variants and recreate them from the assigned variations. Stock values
              will be reset to 0. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerate}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}