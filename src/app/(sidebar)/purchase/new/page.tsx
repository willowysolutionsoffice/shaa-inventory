import { PurchaseFormPage } from "@/components/purchase/purchase-form-page";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { getAllBranches } from "@/actions/auth";

export default async function NewPurchasePage() {
  const [suppliers, branches] = await Promise.all([
    getSupplierListForDropdown(),
    getAllBranches(),
  ]);

  return <PurchaseFormPage suppliers={suppliers} branches={branches} />;
}
