import { SalesFormPage } from "@/components/sales/sales-form-page";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { getAllBranches } from "@/actions/auth";

export default async function NewSalesPage() {
  const [customers, branches] = await Promise.all([
    getCustomerListForDropdown(),
    getAllBranches(),
  ]);

  return <SalesFormPage customers={customers} branches={branches} />;
}
