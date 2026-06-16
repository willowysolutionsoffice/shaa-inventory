// src/app/(dashboard)/sales/page.tsx
export const dynamic = "force-dynamic";

import { SalesTable } from "@/components/sales/sales-table";
import { salesColumns } from "@/components/sales/sales-colums";
import { fetchSales } from "@/actions/sales-action";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { getTodayUtcMidnight, formatUtcDate } from "@/lib/date-utils";

interface SalesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams;

  const page  = typeof params.page  === "string" ? Number(params.page)  : 1;
  const limit = typeof params.limit === "string" ? Number(params.limit) : 20;

  const today          = getTodayUtcMidnight();
  const formattedToday = formatUtcDate(today);

  const from = typeof params.from === "string" ? params.from : formattedToday;
  const to   = typeof params.to   === "string" ? params.to   : formattedToday;

const result = await fetchSales({ page, limit});
console.log("SALES ACTION RESULT:", result);
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
              <p className="text-muted-foreground">Manage your sales</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter defaultDate={{ from: today, to: today }} />
              <Link href="/sales/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sale
                </Button>
              </Link>
            </div>
          </div>

          <SalesTable
  columns={salesColumns}
  data={(result?.sales ?? []) as any}
  metadata={
    result?.metadata ?? {
      totalPages: 0,
      totalCount: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }
  totals={
    result?.totals ?? {
      grandTotal: 0,
      dueAmount: 0,
      paidAmount: 0,
    }
  }
/>
        </div>
      </div>
    </div>
  );
}