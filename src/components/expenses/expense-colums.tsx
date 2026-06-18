"use client";

import { Expense } from "@/types/expense";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseFormDialog } from "./expense-form";
import { ExpenseDeleteDialog } from "./expense-delete-dailog";

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Title{" "}
          {sort === "asc" ? <ArrowUp className="size-4" /> : sort === "desc" ? <ArrowDown className="size-4" /> : <ArrowUpDown className="size-4" />}
        </Button>
      );
    },
    cell: ({ row }) => <div className="px-3">{row.getValue("title")}</div>,
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
    accessorKey: "expenseDate",
    header: () => <div className="px-3 text-center">Date</div>,
    cell: ({ row }) => {
      const date = row.getValue("expenseDate") as string | Date | null;
      return <div className="text-center">{date ? formatDate(date) : "—"}</div>;
    },
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => {
      const name = row.original.category?.name ?? "—";
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="px-3 text-center">Amount</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {formatCurrency(row.getValue("amount"))}
      </div>
    ),
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

const ExpenseActions = ({ expense }: { expense: Expense }) => {
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
      <ExpenseFormDialog   open={openEdit}   openChange={setOpenEdit}   expense={expense} />
      <ExpenseDeleteDialog open={openDelete} setOpen={setOpenDelete}    expense={expense} />
    </div>
  );
};