export const dynamic = "force-dynamic";

import { getSupplierById } from "@/actions/supplier-action";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { notFound } from "next/navigation";
import { SupplierDetailsClient } from "@/components/suppliers/supplier-details-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailsPage({ params }: Props) {
  const { id } = await params;

  const [supplierRes, branches] = await Promise.all([
    getSupplierById(id),
    getBranchListForDropdown(),
  ]);

  if (!supplierRes?.data) notFound();

  return (
    <SupplierDetailsClient
      supplier={supplierRes.data}
      branches={branches ?? []}
    />
  );
}