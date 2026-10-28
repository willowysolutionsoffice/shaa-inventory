export const dynamic = "force-dynamic";

import React from "react";
import { getSalesReturnList } from "@/actions/sales-return-action";
import { getPurchaseReturnList } from "@/actions/purchase-return-action";
import { CreditNotesTable } from "@/app/(sidebar)/sales/credit-notes/credit-notes-table";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { SalesReturnFormSheet } from "@/components/sales-return/sales-return-form";

interface SalesReturnPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SalesReturnPage({ searchParams }: SalesReturnPageProps) {
  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;

  const [salesReturnsRes, purchaseReturnsRes] = await Promise.all([
    getSalesReturnList({ page: 1, limit: 100, from, to }).catch(() => null),
    getPurchaseReturnList({ page: 1, limit: 100, from, to }).catch(() => null),
  ]);

  const salesReturns = salesReturnsRes?.data?.returns ?? [];
  const purchaseReturns = (purchaseReturnsRes?.data as any)?.returns ?? (purchaseReturnsRes?.data as any)?.data ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales Return & Credit/Debit Notes</h1>
              <p className="text-muted-foreground text-sm">
                Manage your sales returns and credit/debit notes
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeFilter />
              <SalesReturnFormSheet />
            </div>
          </div>

          <CreditNotesTable
            salesReturns={salesReturns}
            purchaseReturns={Array.isArray(purchaseReturns) ? purchaseReturns : []}
          />
        </div>
      </div>
    </div>
  );
}
