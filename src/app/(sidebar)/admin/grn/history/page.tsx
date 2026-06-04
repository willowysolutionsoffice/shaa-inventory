export const dynamic = "force-dynamic";

import { getGRNList } from "@/actions/grn-action";
import { GRNHistoryClient } from "@/components/grn/grn-history-client";

export default async function GRNHistoryPage() {
  const { data } = await getGRNList();
  return <GRNHistoryClient grns={data?.grns ?? []} />;
}