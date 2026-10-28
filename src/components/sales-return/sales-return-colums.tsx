"use client";

import { SalesReturn } from "@/types/sales-return";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SalesReturnFormSheet } from "./sales-return-form";
import { SalesReturnDeleteDialog } from "./sales-return-delete-dailog";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const salesReturnColumns: ColumnDef<SalesReturn>[] = [
  {
    accessorKey: "returnNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Return No{" "}
          {sort === "asc" ? <ArrowUp /> : sort === "desc" ? <ArrowDown /> : <ArrowUpDown />}
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold">
        {row.getValue("returnNo")}
      </span>
    ),
  },
  {
    id: "invoiceNo",
    header: "Sale Invoice",
    cell: ({ row }) => <span>{row.original.sale?.invoiceNo ?? "—"}</span>,
  },
  {
    accessorKey: "returnDate",
    header: "Return Date",
    cell: ({ row }) => {
      const date = row.getValue("returnDate") as string | Date | null;
      return <div>{date ? formatDateTime(date) : "—"}</div>;
    },
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => <span>{row.original.customer?.name ?? "—"}</span>,
  },
  {
    id: "branch",
    header: "Branch",
    cell: ({ row }) => <span>{row.original.branch?.name ?? "SHAASHOPY CHEMMAD"}</span>,
  },
  {
    id: "refundMethod",
    header: "Refund Method",
    cell: ({ row }) => {
      const method = String(row.original.refundMethod ?? "").toLowerCase();
      return (
        <span className="capitalize">
          {method === "credit" ? "Credit Note (Store Credit)" : method || "Original"}
        </span>
      );
    },
  },
  {
    accessorKey: "grandTotal",
    header: () => <div className="px-3 text-center">Total Amount</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {formatCurrency(row.getValue("grandTotal"))}
      </div>
    ),
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
      <SalesReturnFormSheet open={openEdit} openChange={setOpenEdit} salesReturn={returnData} />
      <SalesReturnDeleteDialog open={openDelete} setOpen={setOpenDelete} salesReturn={returnData} />
    </div>
  );
};
