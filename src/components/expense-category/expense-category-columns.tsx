"use client";

import { ExpenseCategory } from "@/types/expense";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ExpenseCategoryFormDialog } from "./expense-category-form";
import { ExpenseCategoryDeleteDialog } from "./expense-category-delete-dailog";

export const expenseCategoryColumns: ColumnDef<ExpenseCategory>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Name{" "}
          {sort === "asc" ? <ArrowUp className="size-4" /> : sort === "desc" ? <ArrowDown className="size-4" /> : <ArrowUpDown className="size-4" />}
        </Button>
      );
    },
    cell: ({ row }) => <div className="px-3">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const val = row.getValue("description") as string | null;
      return <div className="px-3">{val || "—"}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="px-3 text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-center px-3">
        <ExpenseCategoryActions expenseCategory={row.original} />
      </div>
    ),
  },
];

const ExpenseCategoryActions = ({ expenseCategory }: { expenseCategory: ExpenseCategory }) => {
  const [openEdit,   setOpenEdit]   = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setOpenEdit(true)} className="h-8 w-8 p-0">
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpenDelete(true)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0">
        <Trash2 className="h-4 w-4" />
      </Button>
      <ExpenseCategoryFormDialog   open={openEdit}   openChange={setOpenEdit}   expenseCategory={expenseCategory} />
      <ExpenseCategoryDeleteDialog open={openDelete} setOpen={setOpenDelete}    expenseCategory={expenseCategory} />
    </div>
  );
};