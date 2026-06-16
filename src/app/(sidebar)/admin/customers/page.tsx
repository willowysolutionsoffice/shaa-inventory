// src/app/(sidebar)/admin/customers/page.tsx
export const dynamic = "force-dynamic";

import { customersColumns }   from "@/components/customers/customer-columns";
import { CustomerTable }      from "@/components/customers/customer-table";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { fetchCustomers } from "@/actions/customer-action";

export default async function CustomerPage() {
  const [{ customers }, branches] = await Promise.all([
    fetchCustomers(),
    getBranchListForDropdown(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground">Manage your customers</p>
            </div>
            <CustomerFormDialog branches={branches} />
          </div>

          <CustomerTable
            columns={customersColumns}
            data={customers as any}
            branches={branches}
          />
        </div>
      </div>
    </div>
  );
}