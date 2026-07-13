// src/app/(sidebar)/sales/pos/page.tsx
export const dynamic = "force-dynamic";

import PosBillingPage from "@/components/sales/pos-billing";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";

export default async function POSPage() {
  const session = await auth.api.getSession();
  const branchId = session?.user?.branchId ?? "";

  let branchName = "Branch";
  if (branchId) {
    try {
      const branch = await api.get<any>(`/branches/${branchId}`);
      branchName = branch?.name ?? "Branch";
    } catch {}
  }

  return <PosBillingPage branchId={branchId} branchName={branchName} />;
}
