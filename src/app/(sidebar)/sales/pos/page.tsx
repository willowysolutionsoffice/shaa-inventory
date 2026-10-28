// src/app/(sidebar)/sales/pos/page.tsx
export const dynamic = "force-dynamic";

import PosBillingPage from "@/components/sales/pos-billing";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";

export default async function POSPage() {
  const session = await auth.api.getSession();
  const branchId = session?.user?.branchId || "branch-calicut-main";
  const branchName = "SHAASHOPY CHEMMAD";

  return <PosBillingPage branchId={branchId} branchName={branchName} />;
}
