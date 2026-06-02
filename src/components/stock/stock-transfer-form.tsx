"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, PackageCheck } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { createStockTransfer } from "@/actions/stock-transfer-actions";
import { Branch, Product } from "@/lib/mock-db";

interface TransferItem {
  productId: string;
  quantity: number;
}

interface StockTransferFormProps {
  branches: Branch[];
  products: Product[];
}

export function StockTransferForm({ branches, products }: StockTransferFormProps) {
    const router = useRouter();
    const { execute, isExecuting } = useAction(createStockTransfer);

    const [fromBranchId, setFromBranchId] = useState("");
    const [toBranchId, setToBranchId] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState<TransferItem[]>([{ productId: "", quantity: 1 }]);

    const availableProducts = fromBranchId
        ? products.filter((p) => p.branchId === fromBranchId)
        : products;

    const addItem = () => {
        setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof TransferItem, value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const getProductStock = (productId: string) => {
        return products.find((p) => p.id === productId)?.stock ?? 0;
    };

    const getProductUnit = (productId: string) => {
        return products.find((p) => p.id === productId)?.unit ?? "pcs";
    };

    const handleSubmit = async () => {
        if (!fromBranchId || !toBranchId) {
            toast.error("Please select both source and destination branches");
            return;
        }
        if (fromBranchId === toBranchId) {
            toast.error("Source and destination branches cannot be the same");
            return;
        }
        const validItems = items.filter((i) => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
            toast.error("Add at least one product to transfer");
            return;
        }

        const result = await execute({
            fromBranchId,
            toBranchId,
            note: note || undefined,
            items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
        });

        if (result?.data?.data) {
            toast.success(`Transfer ${result.data.data.transferNo} created successfully`);
            router.push("/admin/stock-transfer/history");
        } else if (result?.data?.error) {
            toast.error(result.data.error);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Branch Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Transfer Route</CardTitle>
                    <CardDescription>Select the source and destination branches</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <Label className="mb-1.5 block text-sm font-medium">From Branch</Label>
                            <Select value={fromBranchId} onValueChange={setFromBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id} disabled={b.id === toBranchId}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-center pt-5">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <Label className="mb-1.5 block text-sm font-medium">To Branch</Label>
                            <Select value={toBranchId} onValueChange={setToBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select destination branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Transfer Items</CardTitle>
                        <CardDescription>Add products to transfer</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {items.map((item, index) => {
                        const currentStock = getProductStock(item.productId);
                        const unit = getProductUnit(item.productId);
                        const isOverStock = item.productId && item.quantity > currentStock;

                        return (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <div className="flex-1 w-full">
                                    <Select
                                        value={item.productId}
                                        onValueChange={(val) => updateItem(index, "productId", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableProducts.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{p.product_name}</span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {p.stock} {p.unit}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-44">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={currentStock || undefined}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                            className={isOverStock ? "border-destructive" : ""}
                                        />
                                    </div>
                                    {item.productId && (
                                        <span className="text-xs text-muted-foreground w-8 shrink-0">{unit}</span>
                                    )}
                                </div>

                                {item.productId && (
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                        {isOverStock ? (
                                            <span className="text-destructive font-medium">Max: {currentStock}</span>
                                        ) : (
                                            <span>Avail: {currentStock}</span>
                                        )}
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                    <CardDescription>Optional remarks for this transfer</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Reason for transfer, special instructions..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                    />
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isExecuting}>
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {isExecuting ? "Processing..." : "Confirm Transfer"}
                </Button>
            </div>
        </div>
    );
}