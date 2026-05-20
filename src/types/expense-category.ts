import { ExpenseCategoryInput } from "@/schemas/expense-category-schema";
import { ExpenseCategory } from "@prisma/client";
import { ReactNode } from "react";


export type ExpenseCategoryProps = {
  isEdit?: boolean;
  initialData?: ExpenseCategoryInput & { id: string };
  triggerLabel?: ReactNode;
};

export interface ExpenseCategoryFormProps {
  expenseCategory?: ExpenseCategory;
  open?: boolean;
  openChange?: (open: boolean) => void;
}