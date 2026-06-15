import { SupplierInput } from "@/schemas/supplier-schema";
import { ReactNode } from "react";

export type SupplierModalProps = {
  isEdit?: boolean;
  initialData?: SupplierInput & { id: string };
  triggerLabel?: ReactNode;
};
export interface SupplierRow {
  id:                string;
  SupplierId:        string;
  name:              string;
  email?:            string | null;
  phone?:            string | null;
  address?:          string | null;
  openingBalance:    number;
  purchaseDue:       number;
  purchaseReturnDue: number;
  branchId:          string;
  createdAt:         Date | string;
  updatedAt:         Date | string;
}

export interface SupplierFormProps {
  supplier?:   SupplierRow;
  open?:       boolean;
  openChange?: (open: boolean) => void;
}
