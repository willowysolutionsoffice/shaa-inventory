export const dynamic = "force-dynamic";

import { StockTable } from "@/components/stock/stock-table";
import { stockColumns } from "@/components/stock/stock-columns";
import { getProductList } from "@/actions/product-actions";

export default async function StockAdjustmentPage() {
    // Fetch a large number of products to allow easy client-side filtering for adjustment
    // In a larger system, we would implement server-side search for this page too.
    const { data } = await getProductList({ page: 1, limit: 1000 });

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Stock Adjustment</h1>
                    <p className="text-muted-foreground">
                        Update product stock levels directly.
                    </p>
                </div>
            </div>
            <StockTable
                columns={stockColumns}
                data={data?.products ?? []}
            />
        </div>
    );
}
