import { BranchInput } from "@/schemas/branch-schema";
import { Branch } from "@prisma/client";
import { ReactNode } from "react";


export type BranchModalProps = {
  isEdit?: boolean;
  initialData?: BranchInput & { id: string };
  triggerLabel?: ReactNode;
};

export interface BranchFormProps {
  branch?: Branch;
  open?: boolean;
  openChange?: (open: boolean) => void;
}