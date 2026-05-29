// src/app/(sidebar)/admin/variations/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
    getVariationList,
    createVariation,
    updateVariation,
    deleteVariation,
} from "@/actions/variation-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Tag, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variation {
    id: string;
    name: string;
    values: string[];
    createdAt: Date;
    updatedAt: Date;
}

// ─── Variation Form Sheet ─────────────────────────────────────────────────────

interface VariationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variation?: Variation | null;
  onSaved: () => Promise<void>;   // ← was () => void
}

function VariationFormSheet({
    open,
    onOpenChange,
    variation,
    onSaved,
}: VariationFormSheetProps) {
    const isEdit = !!variation;
    const [name, setName] = useState("");
    const [valueInput, setValueInput] = useState("");
    const [values, setValues] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [nameError, setNameError] = useState("");
    const [valuesError, setValuesError] = useState("");

    // Populate form when editing
    useEffect(() => {
        if (open) {
            if (variation) {
                setName(variation.name);
                setValues(variation.values);
            } else {
                setName("");
                setValues([]);
            }
            setValueInput("");
            setNameError("");
            setValuesError("");
        }
    }, [open, variation]);

    const addValue = () => {
        const trimmed = valueInput.trim();
        if (!trimmed) return;
        if (values.includes(trimmed)) {
            toast.error("Value already added");
            return;
        }
        setValues((prev) => [...prev, trimmed]);
        setValueInput("");
        setValuesError("");
    };

    const removeValue = (val: string) => {
        setValues((prev) => prev.filter((v) => v !== val));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addValue();
        }
    };

    const handleSave = async () => {
  let valid = true;
  if (!name.trim()) { setNameError("Variation name is required"); valid = false; }
  else setNameError("");
  if (values.length === 0) { setValuesError("Add at least one value"); valid = false; }
  else setValuesError("");
  if (!valid) return;

  setIsSaving(true);
  try {
    if (isEdit && variation) {
      const result = await updateVariation({ id: variation.id, name: name.trim(), values });
      const error = result?.data?.error;          // ← correct shape
      if (error) { toast.error(error); return; }
      toast.success("Variation updated");
    } else {
      const result = await createVariation({ name: name.trim(), values });
      const error = result?.data?.error;          // ← correct shape
      if (error) { toast.error(error); return; }
      toast.success("Variation created");
    }

    onOpenChange(false);
    await onSaved();                              // ← await the refetch
  } finally {
    setIsSaving(false);
  }
};

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle>{isEdit ? "Edit Variation" : "New Variation"}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? "Update the variation name and values."
                            : "Create a new variation type and its possible values."}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 flex flex-col gap-5 py-4 overflow-y-auto">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                            Variation Name
                            <span className="text-destructive ml-0.5">*</span>
                        </label>
                        <Input
                            placeholder="e.g. Size, Color, Material"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (e.target.value.trim()) setNameError("");
                            }}
                        />
                        {nameError && (
                            <p className="text-xs text-destructive">{nameError}</p>
                        )}
                    </div>

                    {/* Values */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                            Values
                            <span className="text-destructive ml-0.5">*</span>
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. Small, Red, Cotton — press Enter"
                                value={valueInput}
                                onChange={(e) => setValueInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={addValue}
                                className="shrink-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {valuesError && (
                            <p className="text-xs text-destructive">{valuesError}</p>
                        )}

                        {/* Value chips */}
                        {values.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1 p-3 rounded-lg border border-border bg-muted/20 min-h-[48px]">
                                {values.map((val) => (
                                    <span
                                        key={val}
                                        className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2 py-1 text-xs font-medium text-foreground"
                                    >
                                        {val}
                                        <button
                                            type="button"
                                            onClick={() => removeValue(val)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                            Type a value and press Enter or click + to add it.
                        </p>
                    </div>
                </div>

                <SheetFooter className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : isEdit ? "Update Variation" : "Create Variation"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VariationsPage() {
    const [variations, setVariations] = useState<Variation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Variation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const fetchVariations = async () => {
        setIsLoading(true);
        try {
            const result = await getVariationList({});
            setVariations((result?.data?.data as Variation[]) ?? []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVariations();
    }, []);

    const openCreate = () => {
        setEditingVariation(null);
        setSheetOpen(true);
    };

    const openEdit = (variation: Variation) => {
        setEditingVariation(variation);
        setSheetOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteVariation({ id: deleteTarget.id });
            toast.success(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
            fetchVariations();
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = variations.filter((v) =>
        v.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Variations</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage product variations like Size, Color, Material
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Variation
                </Button>
            </div>

            {/* ── Search + Stats ── */}
            <div className="flex items-center gap-3">
                <Input
                    placeholder="Search variations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <span className="text-xs text-muted-foreground ml-auto">
                    {filtered.length} variation{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Table Card ── */}
            <Card className="overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <Layers className="h-8 w-8 animate-pulse opacity-40" />
                            <span className="text-sm">Loading variations...</span>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                        <Tag className="h-10 w-10 opacity-20" />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {search ? "No variations match your search" : "No variations yet"}
                            </p>
                            {!search && (
                                <p className="text-xs mt-1">
                                    Create your first variation to get started
                                </p>
                            )}
                        </div>
                        {!search && (
                            <Button size="sm" onClick={openCreate} className="mt-1">
                                <Plus className="h-4 w-4 mr-1.5" />
                                New Variation
                            </Button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-[220px]">
                                    Variation
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Values
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-[120px]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((variation, i) => (
                                <tr
                                    key={variation.id}
                                    className={cn(
                                        "border-b border-border last:border-0 transition-colors hover:bg-muted/20",
                                    )}
                                >
                                    {/* Name */}
                                    <td className="px-4 py-3.5 font-medium">{variation.name}</td>

                                    {/* Values */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {variation.values.map((val) => (
                                                <Badge
                                                    key={val}
                                                    variant="secondary"
                                                    className="text-xs font-normal"
                                                >
                                                    {val}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => openEdit(variation)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteTarget(variation)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* ── Footer count ── */}
            {!isLoading && filtered.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {variations.length} variations
                </p>
            )}

            {/* ── Create / Edit Sheet ── */}
            <VariationFormSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                variation={editingVariation}
                onSaved={fetchVariations}
            />

            {/* ── Delete Confirmation ── */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete variation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <span className="font-semibold text-foreground">
                                "{deleteTarget?.name}"
                            </span>{" "}
                            and remove it from all products that use it. This action cannot be
                            undone.
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
        </div>
    );
}