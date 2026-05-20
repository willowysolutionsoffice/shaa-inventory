import { getAllUsers, getAllRoles, getAllBranches } from "@/actions/auth";
import { UsersTable } from "@/components/users-table";
import { AddUserDialog } from "@/components/add-user-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface UsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const limit = Number(resolvedSearchParams?.limit) || 10;
  const skip = (page - 1) * limit;

  const [usersData, roles, branches] = await Promise.all([
    getAllUsers(skip, limit),
    getAllRoles(),
    getAllBranches(),
  ]);

  const { users, totalCount } = usersData;
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <AddUserDialog roles={roles} branches={branches} />
      </div>

      <UsersTable users={users} roles={roles} branches={branches} />
      <PaginationControls
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        totalCount={totalCount}
      />
    </div>
  );
}
