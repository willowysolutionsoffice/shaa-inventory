// src/app/(dashboard)/branch/page.tsx
// Server component — fetches branch list directly from the Express backend
// via the shared api helper (no Prisma, no mock-db).

import { branchColumns } from "@/components/branches/branch-columns";
import { BranchTable } from "@/components/branches/branch-table";
import { BranchFormDialog } from "@/components/branches/branch-form";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { api } from "@/lib/api";
import type { Branch } from "@/actions/branch-action";

interface BranchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// The backend returns all branches in one call (the service has no built-in
// pagination yet).  We paginate on the server side here so the UI stays
// identical to the original Prisma-based version.
const PAGE_SIZE_DEFAULT = 10;

export default async function BranchPage({ searchParams }: BranchPageProps) {
  const resolvedParams = await searchParams;

  const page  = Math.max(1, Number(resolvedParams?.page)  || 1);
  const limit = Math.max(1, Number(resolvedParams?.limit) || PAGE_SIZE_DEFAULT);

  // Fetch all branches from the Express API
  let allBranches: Branch[] = [];
  let fetchError: string | null = null;

  try {
    allBranches = await api.get<Branch[]>('/branches');
  } catch (err: any) {
    fetchError = err?.message ?? 'Failed to load branches.';
  }

  // Slice for the current page
  const totalCount = allBranches.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * limit;
  const paginated  = allBranches.slice(start, start + limit);

  const hasNextPage = safePage < totalPages;
  const hasPrevPage = safePage > 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Branch</h1>
              <p className="text-muted-foreground">Manage your branches</p>
            </div>
            <BranchFormDialog />
          </div>

          {/* Error state */}
          {fetchError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}

          {/* Table */}
          <BranchTable columns={branchColumns} data={paginated} />

          {/* Pagination */}
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