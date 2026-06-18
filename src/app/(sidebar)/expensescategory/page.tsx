// src/app/(dashboard)/expense-categories/page.tsx
export const dynamic = "force-dynamic";

import { expenseCategoryColumns }   from "@/components/expense-category/expense-category-columns";
import { ExpenseCategoryTable }     from "@/components/expense-category/expense-category-table";
import { ExpenseCategoryFormDialog } from "@/components/expense-category/expense-category-form";
import { getExpenseCategoryList }   from "@/actions/expense-category-action";

interface ExpenseCategoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExpenseCategoryPage({ searchParams }: ExpenseCategoryPageProps) {
  const params = await searchParams;
  const page   = typeof params.page  === "string" ? Number(params.page)  : 1;
  const limit  = typeof params.limit === "string" ? Number(params.limit) : 10;

  const result = await getExpenseCategoryList({ page, limit });
  const data   = result?.data;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Expense Categories</h1>
              <p className="text-muted-foreground">Manage your expense categories</p>
            </div>
            <ExpenseCategoryFormDialog />
          </div>

          <ExpenseCategoryTable
            columns={expenseCategoryColumns}
            data={data?.categories ?? []}
            metadata={data?.metadata ?? {
              totalPages: 0, totalCount: 0, currentPage: 1,
              hasNextPage: false, hasPrevPage: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}