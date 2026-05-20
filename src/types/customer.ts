import { CustomerInput } from "@/schemas/customer-schema";
import { Customer } from "@prisma/client";
import { ReactNode } from "react";

export type CustomerModalProps = {
  isEdit?: boolean;
  initialData?: CustomerInput & { id: string };
  triggerLabel?: ReactNode;
};

export interface CustomerFormProps {
  customer?: Customer;
  open?: boolean;
  openChange?: (open: boolean) => void;
}
