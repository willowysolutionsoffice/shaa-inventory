export interface ExpenseCategory {
  id:          string;
  name:        string;
  description: string | null;
  createdAt:   string | Date | null;
  updatedAt:   string | Date | null;
}

export interface Expense {
  id:          string;
  title:       string;
  amount:      number;
  expenseDate: string | Date | null;
  description: string | null;
  categoryId:  string;
  branchId:    string;
  createdAt:   string | Date | null;
  updatedAt:   string | Date | null;
  category:    { id: string; name: string } | null;
  branch:      { id: string; name: string } | null;
}

export interface ExpenseFormProps {
  expense?:    Expense;
  open?:       boolean;
  openChange?: (open: boolean) => void;
}

export interface ExpenseCategoryFormProps {
  expenseCategory?: ExpenseCategory;
  open?:            boolean;
  openChange?:      (open: boolean) => void;
}

export interface ExpenseTableProps<TValue> {
  columns:  import("@tanstack/react-table").ColumnDef<Expense, TValue>[];
  data:     Expense[];
  metadata: {
    totalPages:  number;
    totalCount:  number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: { amount: number };
}