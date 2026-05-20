"use client";

import { ExpenseCategory } from "@prisma/client";
import { ExpenseCategoryFormDialog } from "./expense-category-form";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseCategoryDeleteDialog } from "./expense-category-delete-dailog";
import { useState } from "react";

export const expenseCategoryColumns: ColumnDef<ExpenseCategory>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      const renderIcon = () => {
        if (!sort) return <ArrowUpDown className="size-4" />;
        if (sort === "asc") return <ArrowUp className="size-4" />;
        if (sort === "desc") return <ArrowDown className="size-4" />;
        return null;
      };

      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Name
          {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="px-3">{row.getValue("name") as string}</div>
    ),
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

export const ExpenseCategoryActions = ({
  expenseCategory,
}: {
  expenseCategory: ExpenseCategory;
}) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenDelete(true)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit Dialog */}
      <ExpenseCategoryFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        expenseCategory={expenseCategory}
      />

      {/* Delete Dialog */}
      <ExpenseCategoryDeleteDialog
        expenseCategory={expenseCategory}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};
