import { BrandInput } from "@/schemas/brand-schema";
import { Brand } from "@prisma/client";
import { ReactNode } from "react";


export type BrandModalProps = {
  isEdit?: boolean;
  initialData?: BrandInput & { id: string };
  triggerLabel?: ReactNode;
};

export interface BrandFormProps {
  brand?: Brand;
  open?: boolean;
  openChange?: (open: boolean) => void;
}