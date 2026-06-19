export const dynamic = "force-dynamic";

import { PurchaseTable } from "@/components/purchase/purchase-table";
import { purchaseColumns } from "@/components/purchase/purchase-colums";
import { getPurchaseList } from "@/actions/purchase-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DateRangeFilter } from "@/components/common/date-range-filter";

interface ProductPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const params = await searchParams;
  const page  = typeof params.page === "string" ? Number(params.page) : 1;
  const limit = 10_000_000;
  const from  = typeof params.from === "string" ? params.from : undefined;
  const to    = typeof params.to   === "string" ? params.to   : undefined;

  // FIX: guard against action returning an error shape
  const result = await getPurchaseList({ page, limit, from, to });
  const data   = result?.data;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
              <p className="text-muted-foreground">Manage your Purchases</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter defaultDate={undefined} />
              <Link href="/purchase/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Purchase
                </Button>
              </Link>
            </div>
          </div>

          <PurchaseTable
            columns={purchaseColumns}
            data={data?.purchases ?? []}
            metadata={data?.metadata ?? {
              totalPages:  0,
              totalCount:  0,
              currentPage: 1,
              hasNextPage: false,
              hasPrevPage: false,
            }}
            totals={data?.totals ?? { totalAmount: 0, dueAmount: 0, paidAmount: 0 }}
          />
        </div>
      </div>
    </div>
  );
}