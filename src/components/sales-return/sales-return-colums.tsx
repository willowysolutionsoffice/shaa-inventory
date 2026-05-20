"use client";

import { SalesReturn } from "@/types/sales-return"; // adjust if needed
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SalesReturnFormSheet } from "./sales-return-form";
import { SalesReturnDeleteDialog } from "./sales-return-delete-dailog";
import { formatCurrency, formatDate } from "@/lib/utils";

export const salesReturnColumns: ColumnDef<SalesReturn>[] = [
  {
    accessorKey: "invoiceNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Invoice No{" "}
          {sort === "asc" ? (
            <ArrowUp />
          ) : sort === "desc" ? (
            <ArrowDown />
          ) : (
            <ArrowUpDown />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "salesReturnDate",
    header: "Return Date",
    cell: ({ row }) => {
      const date = row.getValue("salesReturnDate") as string | Date;
      return <div>{date ? formatDate(date) : "-"}</div>;
    },
  },
  {
    accessorKey: "customerId",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer?.name ?? "-";
      return <span>{customer}</span>;
    },
  },
  {
    accessorKey: "grandTotal",
    header: () => <div className="px-3 text-center">Total Amount</div>,
    cell: ({ row }) => {
      const amount = row.getValue("grandTotal") as number;
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
        <SalesReturnActions returnData={row.original} />
      </div>
    ),
  },
];

const SalesReturnActions = ({ returnData }: { returnData: SalesReturn }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

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

      <SalesReturnFormSheet
        open={openEdit}
        openChange={setOpenEdit}
        salesReturn={returnData}
      />
      <SalesReturnDeleteDialog
        open={openDelete}
        setOpen={setOpenDelete}
        salesReturn={returnData}
      />
    </div>
  );
};
