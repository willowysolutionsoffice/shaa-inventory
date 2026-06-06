"use client";

import { Purchase } from "@/types/purchase";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePurchaseStatus } from "@/actions/purchase-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { PurchaseDeleteDialog } from "./purchase-delete-dailog";
import { PurchaseFormSheet } from "./purchase-form";
// Removed sheet import; we'll navigate to a dynamic page for view
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExportInvoiceButton } from "../common/export-invoice-button";

export const purchaseColumns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "referenceNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Ref No{" "}
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
    accessorKey: "purchaseDate",
    header: () => <div className="px-3 text-center">Date</div>,
    cell: ({ row }) => {
      const date = row.getValue("purchaseDate") as string | Date;
      return (
        <div className="flex justify-center px-3">
          {date ? formatDate(date) : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const Location = row.original.branch?.name;

      return <span>{Location}</span>;
    },
  },
  {
    accessorKey: "supplierId",
    header: "Supplier",
    cell: ({ row }) => {
      const Supplier = row.original.supplier.name;

      return <span>{Supplier}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Purchase Status",
    cell: ({ row }) => {
      const purchaseStatus = row.original.status;

      const statusColorMap: Record<string, string> = {
        Received: "bg-green-100 text-green-800",
        Pending: "bg-yellow-100 text-yellow-800",
        Cancelled: "bg-red-100 text-red-800",
      };

      const colorClasses =
        statusColorMap[purchaseStatus] || "bg-gray-100 text-gray-800";

      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${colorClasses}`}
        >
          {purchaseStatus}
        </span>
      );
    },
    enableColumnFilter: true,
  },
  {
    id: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const payments = row.original.payments ?? [];
      const dueDate = payments.find((p) => p.dueDate)?.dueDate;
      const dueAmount = row.original.dueAmount ?? 0;

      // fully paid
      if (dueAmount === 0) {
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
            Paid
          </span>
        );
      }

      if (!dueDate) {
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
            No Due Date
          </span>
        );
      }

      const today = new Date();
      const due = new Date(dueDate);

      if (due < today) {
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-800">
            Overdue
          </span>
        );
      }

      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
          Upcoming Payment
        </span>
      );
    },
  },
  {
    accessorKey: "paymentDue",
    header: "Payment Due",
    cell: ({ row }) => {
      const amount = row.getValue("paymentDue") as number;
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Grand Total",
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number;
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },

  {
    id: "actions",
    header: () => (
      <div className="flex items-center justify-center">Actions</div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-1">
        <ExportInvoiceButton data={row.original} type="purchase" />
        <PurchaseActions purchase={row.original} />
      </div>
    ),
  },
];

const PurchaseActions = ({ purchase }: { purchase: Purchase }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const router = useRouter();

  const { execute: updateStatus, isExecuting } = useAction(
    updatePurchaseStatus,
    {
      onSuccess: ({ data }) => {
        if (data?.error) {
          toast.error(data.error);
        } else {
          toast.success("Purchase approved (Received)");
        }
      },
      onError: () => toast.error("Something went wrong"),
    },
  );

  return (
    <div className="flex w-[96px] justify-center">
      {purchase.status === "Purchase_Order" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateStatus({ id: purchase.id, status: "Received" })}
          disabled={isExecuting}
          className="h-8 gap-1 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
        >
          <Check className="h-3.5 w-3.5" />
          {isExecuting ? "..." : "Approve"}
        </Button>
      ) : (
        <div className="w-[88px]" /> // Approximate width of the Approve button to maintain alignment
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/purchase/${purchase.id}`)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
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

      <PurchaseFormSheet
        open={openEdit}
        openChange={setOpenEdit}
        purchase={purchase}
      />
      <PurchaseDeleteDialog
        purchase={purchase}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};
