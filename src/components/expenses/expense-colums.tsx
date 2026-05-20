"use client";
import { Expense } from "@/types/expense";
import { ExpenseFormDialog } from "./expense-form";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseDeleteDialog } from "./expense-delete-dailog";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "title",
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
          Title
          {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="px-3">{row.getValue("title") as string}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description");
      return (
        <div className="px-3">{description ? String(description) : "..."}</div>
      );
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="px-3 text-center">Date</div>,
    cell: ({ row }) => {
      const date = row.getValue("date") as string | Date;
      return <div className="text-center">{date ? formatDate(date) : "-"}</div>;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const expenseCategory = row.original.category.name;
      return (
        <span
          className={`inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800`}
        >
          {expenseCategory}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="px-3 text-center">Amount</div>,
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="px-3 text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-center px-3">
        <ExpenseActions expense={row.original} />
      </div>
    ),
  },
];

export const ExpenseActions = ({ expense }: { expense: Expense }) => {
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
      <ExpenseFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        expense={expense}
      />

      {/* Delete Dialog */}
      <ExpenseDeleteDialog
        expense={expense}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};
