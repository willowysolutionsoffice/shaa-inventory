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
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { PurchaseDeleteDialog } from "./purchase-delete-dailog";
import { PurchaseFormSheet } from "./purchase-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExportInvoiceButton } from "../common/export-invoice-button";

// ── Payment status badge ───────────────────────────────────────────────────────
// Backend PaymentStatus enum: PENDING | PARTIAL | PAID

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID:    "bg-green-100 text-green-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-red-100 text-red-800",
};

function PaymentStatusBadge({ status }: { status: string }) {
  const classes =
    PAYMENT_STATUS_STYLES[status?.toUpperCase()] ?? "bg-gray-100 text-gray-800";
  const label =
    status === "PAID"    ? "Paid"    :
    status === "PARTIAL" ? "Partial" :
    status === "PENDING" ? "Pending" :
    status ?? "—";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

// ── Overdue helper ─────────────────────────────────────────────────────────────

function PaymentDueStatusBadge({ purchase }: { purchase: Purchase }) {
  const dueAmount = purchase.dueAmount ?? purchase.paymentDue ?? 0;

  if (dueAmount === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
        Paid
      </span>
    );
  }

  const dueDate = (purchase.payments ?? []).find((p) => p.dueDate)?.dueDate;

  if (!dueDate) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
        No Due Date
      </span>
    );
  }

  const isOverdue = new Date(dueDate) < new Date();
  return isOverdue ? (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-800">
      Overdue
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
      Upcoming
    </span>
  );
}

// ── Column definitions ─────────────────────────────────────────────────────────

export const purchaseColumns: ColumnDef<Purchase>[] = [
  {
    // purchaseNo is the canonical field; referenceNo is the frontend alias
    accessorKey: "purchaseNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Purchase No{" "}
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
    cell: ({ row }) => (
      <span>{row.original.purchaseNo ?? row.original.referenceNo ?? "—"}</span>
    ),
  },
  {
    accessorKey: "purchaseDate",
    header: () => <div className="px-3 text-center">Date</div>,
    cell: ({ row }) => {
      const date = row.getValue("purchaseDate") as string | Date;
      return (
        <div className="flex justify-center px-3">
          {date ? formatDate(date) : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <span>{row.original.branch?.name ?? "—"}</span>,
  },
  {
    accessorKey: "supplierId",
    header: "Supplier",
    cell: ({ row }) => <span>{row.original.supplier?.name ?? "—"}</span>,
  },
  {
    // paymentStatus from Prisma: PENDING | PARTIAL | PAID
    id: "paymentStatus",
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.original.paymentStatus ?? ""} />
    ),
    enableColumnFilter: true,
  },
  {
    id: "dueStatus",
    header: "Due Status",
    cell: ({ row }) => <PaymentDueStatusBadge purchase={row.original} />,
  },
  {
    accessorKey: "paymentDue",
    header: "Amount Due",
    cell: ({ row }) => {
      const amount = Number(
        row.original.paymentDue ?? row.original.dueAmount ?? 0
      );
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Grand Total",
    cell: ({ row }) => {
      const amount = Number(row.getValue("totalAmount") ?? 0);
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

// ── Row-level actions ──────────────────────────────────────────────────────────

const PurchaseActions = ({ purchase }: { purchase: Purchase }) => {
  const [openEdit, setOpenEdit]     = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/purchase/${purchase.id}`)}
        className="h-8 w-8 p-0"
        title="View details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 p-0"
        title="Edit"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenDelete(true)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0"
        title="Delete"
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