"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PurchaseReturn } from "@/types/purchase-return";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { PurchaseReturnFormSheet } from "./purchase-return-form";
import { PurchaseReturnDeleteDialog } from "./purchase-return-delete-dailog";
import { formatCurrency, formatDate } from "@/lib/utils";

export const purchaseReturnColumns: ColumnDef<PurchaseReturn>[] = [
  {
    accessorKey: "referenceNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Ref No {sort === "asc" ? <ArrowUp /> : sort === "desc" ? <ArrowDown /> : <ArrowUpDown />}
        </Button>
      );
    },
  },
  {
    accessorKey: "returnDate",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("returnDate") as string | Date;
      return <div>{date ? formatDate(date) : "-"}</div>;
    },
  },
  {
    accessorKey: "supplierId",
    header: "Supplier",
    cell: ({ row }) => {
      const supplierName = row.original.supplier?.name;
      return <span>{supplierName ?? "-"}</span>;
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Return Total",
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number;
      return <div className="font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <PurchaseReturnActions purchaseReturn={row.original} />,
  },
];

const PurchaseReturnActions = ({ purchaseReturn }: { purchaseReturn: PurchaseReturn }) => {
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
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <PurchaseReturnFormSheet open={openEdit} openChange={setOpenEdit} purchaseReturn={purchaseReturn} />
      <PurchaseReturnDeleteDialog purchaseReturn={purchaseReturn} open={openDelete} setOpen={setOpenDelete} />
    </div>
  );
};
