import { SupplierInput } from "@/schemas/supplier-schema";
import { Supplier } from "@prisma/client";
import { ReactNode } from "react";

export type SupplierModalProps = {
  isEdit?: boolean;
  initialData?: SupplierInput & { id: string };
  triggerLabel?: ReactNode;
};

export interface SupplierFormProps {
  supplier?: Supplier;
  open?: boolean;
  openChange?: (open: boolean) => void;
}
