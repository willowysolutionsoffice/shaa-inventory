export const dynamic = "force-dynamic";

import { SalesReturnTable } from "@/components/sales-return/sales-return-table";
import { SalesReturnFormSheet } from "@/components/sales-return/sales-return-form";
import { salesReturnColumns } from "@/components/sales-return/sales-return-colums";
import { getSalesReturnList } from "@/actions/sales-return-action";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { format } from "date-fns";
import { getTodayUtcMidnight, formatUtcDate } from "@/lib/date-utils";

interface SalesReturnPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SalesReturnPage({ searchParams }: SalesReturnPageProps) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number(params.page) : 1;
  const limit = 10000000;

  const today = getTodayUtcMidnight();
  const formattedToday = formatUtcDate(today);

  const from = typeof params.from === "string" ? params.from : formattedToday;
  const to = typeof params.to === "string" ? params.to : formattedToday;


  const { data } = await getSalesReturnList({ page, limit, from, to });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales Returns</h1>
              <p className="text-muted-foreground">Manage your Sales Returns</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter defaultDate={{ from: today, to: today }} />
              <SalesReturnFormSheet />
            </div>
          </div>

          <SalesReturnTable
            columns={salesReturnColumns}
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
            totals={data?.totals ?? { grandTotal: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
