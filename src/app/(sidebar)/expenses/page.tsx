// src/app/(dashboard)/expenses/page.tsx
export const dynamic = "force-dynamic";

import { expenseColumns }    from "@/components/expenses/expense-colums";
import { ExpenseTable }      from "@/components/expenses/expense-table";
import { ExpenseFormDialog } from "@/components/expenses/expense-form";
import { getExpenseList }    from "@/actions/expense-actions";
import { DateRangeFilter }   from "@/components/common/date-range-filter";
import { getTodayUtcMidnight, formatUtcDate } from "@/lib/date-utils";

interface ExpensePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExpensePage({ searchParams }: ExpensePageProps) {
  const params = await searchParams;

  const page  = typeof params.page  === "string" ? Number(params.page)  : 1;
  const limit = typeof params.limit === "string" ? Number(params.limit) : 10;

  const today          = getTodayUtcMidnight();
  const formattedToday = formatUtcDate(today);
  const from           = typeof params.from === "string" ? params.from : formattedToday;
  const to             = typeof params.to   === "string" ? params.to   : formattedToday;

  const result = await getExpenseList({ page, limit, from, to });
  const data   = result?.data;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
              <p className="text-muted-foreground">Manage your expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter defaultDate={{ from: today, to: today }} />
              <ExpenseFormDialog />
            </div>
          </div>

          <ExpenseTable
            columns={expenseColumns}
            data={data?.expense ?? []}
            metadata={data?.metadata ?? {
              totalPages: 0, totalCount: 0, currentPage: 1,
              hasNextPage: false, hasPrevPage: false,
            }}
            totals={data?.totals ?? { amount: 0 }}
          />
        </div>
      </div>
    </div>
  );
}