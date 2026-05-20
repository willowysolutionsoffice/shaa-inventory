import { expenseCategoryColumns } from "@/components/expense-category/expense-category-columns";
import { ExpenseTable } from "@/components/expense-category/expense-category-table";
import { prisma } from "@/lib/prisma";
import { ExpenseCategoryFormDialog } from "@/components/expense-category/expense-category-form";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface ExpenseCategoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExpenseCategoryPage({
  searchParams,
}: ExpenseCategoryPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const limit = Number(resolvedSearchParams?.limit) || 10;
  const skip = (page - 1) * limit;

  const [expenseCategory, totalCount] = await Promise.all([
    prisma.expenseCategory.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.expenseCategory.count(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Expense Category
              </h1>
              <p className="text-muted-foreground">
                Manage your Expense Category
              </p>
            </div>
            <ExpenseCategoryFormDialog />
          </div>

          <ExpenseTable
            columns={expenseCategoryColumns}
            data={expenseCategory}
          />
          <PaginationControls
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            totalCount={totalCount}
          />
        </div>
      </div>
    </div>
  );
}
