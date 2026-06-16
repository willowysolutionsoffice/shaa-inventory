// src/app/(sidebar)/admin/customers/[id]/page.tsx
export const dynamic = "force-dynamic";

import { notFound }              from "next/navigation";
import { getCustomerById }       from "@/actions/customer-action";
import { CustomerHistoryClient } from "@/components/customers/customer-history-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerHistoryPage({ params }: Props) {
  const { id } = await params;
  const result = await getCustomerById({ id });

  if (!result?.data || "error" in result.data) notFound();

  const { customer, sales, returns, loyaltyPoints, loyaltyTier, totalSpent, totalReturned } = result.data;

  return (
    <CustomerHistoryClient
      customer={customer   as any}
      sales={sales         as any}
      returns={returns     as any}
      loyaltyPoints={loyaltyPoints}
      loyaltyTier={loyaltyTier as any}
      totalSpent={totalSpent}
      totalReturned={totalReturned}
    />
  );
}