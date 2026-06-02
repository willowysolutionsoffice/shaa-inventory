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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, TriangleAlert } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { createDamageRecord, getDamageRecords } from "@/actions/damage-stock-actions";
import { Branch, Product } from "@/lib/mock-db";
import { format } from "date-fns";
import { useEffect } from "react";

const DAMAGE_REASONS = [
    "Physical Damage",
    "Water Damage",
    "Expiry",
    "Theft",
    "Quality Issue",
    "Other",
] as const;

type DamageReason = (typeof DAMAGE_REASONS)[number];

interface DamageStockFormProps {
    branches: Branch[];
    products: Product[];
}

function reasonBadgeClass(reason: string) {
    const map: Record<string, string> = {
        "Physical Damage": "bg-orange-100 text-orange-700 border-orange-200",
        "Water Damage": "bg-blue-100 text-blue-700 border-blue-200",
        Expiry: "bg-yellow-100 text-yellow-700 border-yellow-200",
        Theft: "bg-red-100 text-red-700 border-red-200",
        "Quality Issue": "bg-purple-100 text-purple-700 border-purple-200",
        Other: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return map[reason] ?? map.Other;
}

export function DamageStockForm({ branches, products }: DamageStockFormProps) {
    const router = useRouter();
    const { execute, isExecuting } = useAction(createDamageRecord);
    const { execute: fetchHistory } = useAction(getDamageRecords);

    const [branchId, setBranchId] = useState("");
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [reason, setReason] = useState<DamageReason | "">("");
    const [note, setNote] = useState("");
    const [history, setHistory] = useState<any[]>([]);

    const filteredProducts = branchId
        ? products.filter((p) => p.branchId === branchId)
        : products;

    const selectedProduct = products.find((p) => p.id === productId);
    const stockValue = selectedProduct ? selectedProduct.purchasePrice * quantity : 0;
    const isOverStock = selectedProduct && quantity > selectedProduct.stock;

    const loadHistory = async () => {
        const result = await fetchHistory({});
        if (result?.data?.data) setHistory(result.data.data);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleSubmit = async () => {
        if (!branchId || !productId || !reason) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (quantity < 1) {
            toast.error("Quantity must be at least 1");
            return;
        }

        const result = await execute({
            branchId,
            productId,
            quantity,
            reason: reason as DamageReason,
            note: note || undefined,
        });

        if (result?.data?.data) {
            toast.success(`Damage recorded: ${result.data.data.damageNo}`);
            setBranchId("");
            setProductId("");
            setQuantity(1);
            setReason("");
            setNote("");
            await loadHistory();
        } else if (result?.data?.error) {
            toast.error(result.data.error);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Form */}
            <Card className="border-destructive/20">
                <CardHeader className="flex flex-row items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10 text-destructive shrink-0">
                        <TriangleAlert className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Record Damaged Stock</CardTitle>
                        <CardDescription>
                            This will permanently deduct the quantity from available stock
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Branch <span className="text-destructive">*</span></Label>
                            <Select value={branchId} onValueChange={(v) => { setBranchId(v); setProductId(""); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Product <span className="text-destructive">*</span></Label>
                            <Select value={productId} onValueChange={setProductId} disabled={!branchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={branchId ? "Select product" : "Select branch first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredProducts.map((p) => (
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

                        <div className="flex flex-col gap-1.5">
                            <Label>Quantity <span className="text-destructive">*</span></Label>
                            <Input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                className={isOverStock ? "border-destructive" : ""}
                            />
                            {isOverStock && (
                                <p className="text-xs text-destructive">
                                    Exceeds available stock ({selectedProduct?.stock})
                                </p>
                            )}
                            {selectedProduct && !isOverStock && (
                                <p className="text-xs text-muted-foreground">
                                    Available: {selectedProduct.stock} {selectedProduct.unit}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Reason <span className="text-destructive">*</span></Label>
                            <Select value={reason} onValueChange={(v) => setReason(v as DamageReason)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAMAGE_REASONS.map((r) => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedProduct && quantity > 0 && (
                        <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Estimated stock loss value</span>
                            <span className="font-semibold text-destructive">
                                ₹{stockValue.toLocaleString("en-IN")}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label>Note</Label>
                        <Textarea
                            placeholder="Additional details about the damage..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="destructive"
                            onClick={handleSubmit}
                            disabled={isExecuting || !!isOverStock}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {isExecuting ? "Recording..." : "Record Damage"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Damage History</CardTitle>
                    <CardDescription>All recorded stock damage entries</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="bg-primary text-primary-foreground">Damage #</TableHead>
                                <TableHead className="bg-primary text-primary-foreground">Date</TableHead>
                                <TableHead className="bg-primary text-primary-foreground">Product</TableHead>
                                <TableHead className="bg-primary text-primary-foreground">Branch</TableHead>
                                <TableHead className="bg-primary text-primary-foreground">Qty</TableHead>
                                <TableHead className="bg-primary text-primary-foreground">Reason</TableHead>
                                <TableHead className="bg-primary text-primary-foreground text-right">Loss Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length > 0 ? (
                                history.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-mono text-sm font-medium">{record.damageNo}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(record.damageDate), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{record.product_name}</p>
                                                <p className="text-xs text-muted-foreground">{record.sku}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{record.branchName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{record.quantity}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${reasonBadgeClass(record.reason)}`}>
                                                {record.reason}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium text-destructive">
                                            ₹{record.stockValue.toLocaleString("en-IN")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No damage records yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}