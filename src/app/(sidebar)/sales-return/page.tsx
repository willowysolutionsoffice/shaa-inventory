export const dynamic = "force-dynamic";

import { SalesReturnTable }     from "@/components/sales-return/sales-return-table";
import { SalesReturnFormSheet } from "@/components/sales-return/sales-return-form";
import { salesReturnColumns }   from "@/components/sales-return/sales-return-colums";
import { getSalesReturnList }   from "@/actions/sales-return-action";

interface SalesReturnPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SalesReturnPage({ searchParams }: SalesReturnPageProps) {
  const params = await searchParams;
  const page   = typeof params.page === "string" ? Number(params.page) : 1;

  const result = await getSalesReturnList({ page, limit: 20 });
  const data   = result?.data;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales Returns</h1>
              <p className="text-muted-foreground">Manage your sales returns</p>
            </div>
            <SalesReturnFormSheet />
          </div>

          <SalesReturnTable
            columns={salesReturnColumns}
            data={data?.returns ?? []}
            metadata={data?.metadata ?? {
              totalPages: 0, totalCount: 0, currentPage: 1,
              hasNextPage: false, hasPrevPage: false,
            }}
            totals={data?.totals ?? { grandTotal: 0 }}
          />
        </div>
      </div>
    </div>
  );
}