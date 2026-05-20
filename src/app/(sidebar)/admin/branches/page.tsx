import { branchColumns } from "@/components/branches/branch-columns";
import { BranchTable } from "@/components/branches/branch-table";
import { prisma } from "@/lib/prisma";
import { BranchFormDialog } from "@/components/branches/branch-form";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface BranchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BranchPage({ searchParams }: BranchPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const limit = Number(resolvedSearchParams?.limit) || 10;
  const skip = (page - 1) * limit;

  const [branch, totalCount] = await Promise.all([
    prisma.branch.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.branch.count(),
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
              <h1 className="text-2xl font-bold tracking-tight">Branch</h1>
              <p className="text-muted-foreground">Manage your branches</p>
            </div>
            <BranchFormDialog />
          </div>

          <BranchTable columns={branchColumns} data={branch} />
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
