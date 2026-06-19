// src/app/(dashboard)/admin/stock-transfer/page.tsx
export const dynamic = "force-dynamic";

import { api } from "@/lib/api";
import { StockTransferForm } from "@/components/stock/stock-transfer-form";
import { getProductDropdown } from "@/actions/product-actions";

export default async function StockTransferPage() {
    const [branches, products] = await Promise.all([
        api.get<any[]>("/branches/dropdown").catch(() => []),
        getProductDropdown(),
    ]);

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Stock Transfer</h1>
                <p className="text-muted-foreground">
                    Move stock between branches. Transfers are processed immediately.
                </p>
            </div>
            <StockTransferForm branches={branches ?? []} products={products} />
        </div>
    );
}