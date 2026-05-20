import { Expense as PrismaExpense } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Expense extends PrismaExpense {
  category: { name: string };
}

export interface ExpenseFormProps {
  expense?: Expense;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface ExpenseTableProps<TValue> {
  columns: ColumnDef<Expense, TValue>[];
  data: Expense[];
  metadata: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    amount: number;
  };
}