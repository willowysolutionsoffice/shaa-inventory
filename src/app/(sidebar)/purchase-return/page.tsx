export const dynamic = "force-dynamic";

import { PurchaseReturnTable } from "@/components/purchase-return/purchase-return-table";
import { PurchaseReturnFormSheet } from "@/components/purchase-return/purchase-return-form";
import { purchaseReturnColumns } from "@/components/purchase-return/purchase-return-colums";
import { getPurchaseReturnList } from "@/actions/purchase-return-action";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { format } from "date-fns";
import { getTodayUtcMidnight, formatUtcDate } from "@/lib/date-utils";

interface PurchaseReturnPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PurchaseReturnPage({ searchParams }: PurchaseReturnPageProps) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number(params.page) : 1;
  const limit = 10000000;

  const today = getTodayUtcMidnight();
  const formattedToday = formatUtcDate(today);

  const from = typeof params.from === "string" ? params.from : formattedToday;
  const to = typeof params.to === "string" ? params.to : formattedToday;


  const { data } = await getPurchaseReturnList({ page, limit, from, to });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Purchase Returns</h1>
              <p className="text-muted-foreground">Manage your Purchase Returns</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter defaultDate={{ from: today, to: today }} />
              <PurchaseReturnFormSheet />
            </div>
          </div>

          <PurchaseReturnTable
            columns={purchaseReturnColumns}
            data={data?.returns ?? []}
            metadata={
              data?.metadata ?? {
                totalPages: 0,
                totalCount: 0,
                currentPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
              }
            }
            totals={data?.totals ?? { totalAmount: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
