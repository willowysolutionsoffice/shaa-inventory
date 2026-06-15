import { SalesFormPage } from "@/components/sales/sales-form-page";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { getBranchListForDropdown } from "@/actions/branch-action";

export default async function NewSalesPage() {
  const [customers, branches] = await Promise.all([
    getCustomerListForDropdown(),
    getBranchListForDropdown(),
  ]);

  return <SalesFormPage customers={customers} branches={branches} />;
}
