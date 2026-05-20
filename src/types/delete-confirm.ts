import { ReactNode } from "react";

export type DeleteConfirmModalProps = {
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  trigger?: ReactNode;
};