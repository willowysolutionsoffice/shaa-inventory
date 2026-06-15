import { PurchaseFormPage } from "@/components/purchase/purchase-form-page";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { getBranchListForDropdown } from "@/actions/branch-action";

export default async function NewPurchasePage() {
  const [suppliers, branches] = await Promise.all([
    getSupplierListForDropdown(),
    getBranchListForDropdown(),
  ]);

  return <PurchaseFormPage suppliers={suppliers} branches={branches} />;
}
