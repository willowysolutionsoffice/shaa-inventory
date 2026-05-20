"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/product";
import { updateProductStock } from "@/actions/stock-actions";
import { toast } from "sonner";
import { Check, RefreshCw } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

interface ProductStockUpdateCellProps {
    product: Product;
}

export const ProductStockUpdateCell = ({ product }: ProductStockUpdateCellProps) => {
    const [stock, setStock] = useState<string | number>(product.stock);
    const { execute, isExecuting } = useAction(updateProductStock);
    const [isDirty, setIsDirty] = useState(false);

    const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "") {
            setStock("");
            setIsDirty(true);
            return;
        }
        const newVal = parseInt(val);
        if (!isNaN(newVal) && newVal >= 0) {
            setStock(newVal);
            setIsDirty(newVal !== product.stock);
        }
    };

    const handleUpdate = async () => {
        try {
            await execute({ id: product.id, stock: Number(stock) || 0 });
            toast.success(`Stock updated for ${product.product_name}`);
            setIsDirty(false);
        } catch {
            toast.error("Failed to update stock");
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Input
                type="number"
                value={stock}
                onChange={handleStockChange}
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
                    {isExecuting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4" />
                    )}
                </Button>
            )}
        </div>
    );
};
