export const dynamic = "force-dynamic";

import { getGRNList } from "@/actions/grn-action";
import { getPurchaseList } from "@/actions/purchase-actions";
import { GRNTable } from "@/components/grn/grn-table";
import { grnColumns } from "@/components/grn/grn-columns";
import { GRNCreateForm } from "@/components/grn/grn-create-form";

export default async function GRNPage() {
  const [grnResult, purchaseResult] = await Promise.all([
    getGRNList(),
    getPurchaseList({ page: 1, limit: 1000 }),
  ]);

  // Only show POs that don't already have a GRN
  const existingGRNPurchaseIds = new Set(
    (grnResult.data?.grns ?? []).map((g) => g.purchase?.id).filter(Boolean)
  );
  const availablePOs = (purchaseResult.data?.purchases ?? []).filter(
    (p) => !existingGRNPurchaseIds.has(p.id)
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes</h1>
              <p className="text-muted-foreground">
                Verify and manage incoming stock from suppliers
              </p>
            </div>
            <GRNCreateForm purchases={availablePOs as any} />
          </div>
          <GRNTable
            columns={grnColumns}
            data={grnResult.data?.grns ?? []}
          />
        </div>
      </div>
    </div>
  );
}