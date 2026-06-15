export const dynamic = "force-dynamic";

import { StockTable } from "@/components/stock/stock-table";
import { stockColumns } from "@/components/stock/stock-columns";
import { getProductList } from "@/actions/product-actions";

export default async function StockAdjustmentPage() {
  // Fetch all products — variants are loaded lazily client-side per row
  const result = await getProductList({ page: 1, limit: 1000 });
  const data   = result?.data?.data;

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustment</h1>
          <p className="text-muted-foreground">
            Update stock levels. Products with variants show individual variant controls.
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