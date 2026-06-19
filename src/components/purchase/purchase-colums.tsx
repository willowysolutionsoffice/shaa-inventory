"use client";

import { Purchase } from "@/types/purchase";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseDeleteDialog } from "./purchase-delete-dailog";
import { PurchaseFormSheet } from "./purchase-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExportInvoiceButton } from "../common/export-invoice-button";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID:    "bg-green-100 text-green-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID:    "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
};

// FIX: human-readable labels for the PaymentMethod enum stored in DB
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH:          "Cash",
  CARD:          "Card",
  UPI:           "UPI",
  CHEQUE:        "Cheque",
  BANK_TRANSFER: "Bank Transfer",
  OTHER:         "Other",
};

function formatPaymentMethod(raw: string): string {
  return PAYMENT_METHOD_LABELS[raw?.toUpperCase()] ?? raw ?? "—";
}

function PaymentStatusBadge({ status }: { status: string }) {
  const key     = status?.toUpperCase();
  const classes = PAYMENT_STATUS_STYLES[key] ?? "bg-gray-100 text-gray-800";
  const label   = PAYMENT_STATUS_LABELS[key]  ?? status ?? "—";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${classes}`}>
      {label}
    </span>
  );
}

function PaymentDueStatusBadge({ purchase }: { purchase: Purchase }) {
  // FIX: consistent field access — paymentDue is the Prisma field name
  const dueAmount = Number(purchase.paymentDue ?? purchase.dueAmount ?? 0);

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
        No due date
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

// FIX: define a proper filterFn so paymentStatus column filter actually works.
// Without this TanStack Table falls back to auto, which does a loose includes()
// and can match PARTIAL when filtering for PAID.
const exactStatusFilter: FilterFn<Purchase> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  return row.getValue<string>(columnId) === filterValue;
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const purchaseColumns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "purchaseNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Purchase No{" "}
          {sort === "asc" ? <ArrowUp /> : sort === "desc" ? <ArrowDown /> : <ArrowUpDown />}
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
      return <div className="flex justify-center px-3">{date ? formatDate(date) : "—"}</div>;
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
    id:          "paymentStatus",
    accessorKey: "paymentStatus",
    header:      "Payment Status",
    // FIX: use the exact-match filterFn instead of TanStack's default
    filterFn:    exactStatusFilter,
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.original.paymentStatus ?? ""} />
    ),
    enableColumnFilter: true,
  },
  {
    id:     "dueStatus",
    header: "Due Status",
    cell:   ({ row }) => <PaymentDueStatusBadge purchase={row.original} />,
  },
  {
  accessorKey: "paymentDue",
  header:      "Amount Due",
  cell: ({ row }) => {
    const grandTotal     = Number(row.original.totalAmount ?? 0);
    const openingBalance = Number((row.original as any).supplier?.openingBalance ?? 0);
    const totalPayable   = openingBalance + grandTotal;

    // Sum what was actually paid from payment records
    const paid = (row.original.payments ?? []).reduce(
      (sum: number, p: any) => sum + Number(p.amount ?? 0),
      0,
    );

    const due = Math.max(0, totalPayable - paid);

    return (
      <div className="text-center font-medium text-destructive">
        {formatCurrency(due)}
      </div>
    );
  },
},
{
  accessorKey: "totalAmount",
  header:      "Grand Total",
  cell: ({ row }) => {
    const grandTotal     = Number(row.original.totalAmount ?? 0);
    const openingBalance = Number((row.original as any).supplier?.openingBalance ?? 0);
    const totalPayable   = openingBalance + grandTotal;
    return (
      <div className="text-center font-medium space-y-0.5">
        <div>{formatCurrency(totalPayable)}</div>
        {openingBalance > 0 && (
          <div className="text-xs text-muted-foreground">
            {formatCurrency(grandTotal)} + {formatCurrency(openingBalance)}
          </div>
        )}
      </div>
    );
  },
},
  {
    id:     "actions",
    header: () => <div className="flex items-center justify-center">Actions</div>,
    cell:   ({ row }) => (
      <div className="flex items-center justify-center gap-1">
        <ExportInvoiceButton data={row.original} type="purchase" />
        <PurchaseActions purchase={row.original} />
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Row-level actions
// ---------------------------------------------------------------------------

const PurchaseActions = ({ purchase }: { purchase: Purchase }) => {
  const [openEdit,   setOpenEdit]   = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost" size="sm"
        onClick={() => router.push(`/purchase/${purchase.id}`)}
        className="h-8 w-8 p-0" title="View details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 p-0" title="Edit"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm"
        onClick={() => setOpenDelete(true)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0" title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <PurchaseFormSheet open={openEdit} openChange={setOpenEdit} purchase={purchase} />
      <PurchaseDeleteDialog purchase={purchase} open={openDelete} setOpen={setOpenDelete} />
    </div>
  );
};