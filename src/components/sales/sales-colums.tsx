"use client";

// src/components/sales/sales-columns.tsx

import { Sale } from "@/types/sales";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2, Eye, Check,
} from "lucide-react";
import { Button }              from "@/components/ui/button";
import { SalesDeleteDialog }   from "./sales-delete-dailog";
import { SalesFormSheet }      from "./sales-form";
import { ExportInvoiceButton } from "../common/export-invoice-button";
import { useState }            from "react";
import { useRouter }           from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateSalesStatus }   from "@/actions/sales-action";
import { useAction }           from "next-safe-action/hooks";
import { toast }               from "sonner";

// ── Status helpers ─────────────────────────────────────────────────────────────

/** Normalise the mixed status values that come back from the API.
 *  Prisma stores PaymentStatus (PENDING/PARTIAL/PAID) on the sale, but the
 *  frontend also receives the order-flow status ("Ordered"/"Dispatched") via
 *  the paymentStatus field when the backend maps them. */
function resolveOrderStatus(sale: Sale): string {
  const raw = (sale as any).status ?? (sale as any).paymentStatus ?? "";
  if (raw === "PENDING")  return "Ordered";
  if (raw === "PAID")     return "Dispatched"; // PAID → Dispatched ✅
  if (raw === "PARTIAL")  return "Ordered";
  return raw || "Ordered";
}

function resolvePaymentStatus(sale: Sale): { label: string; className: string } {
  const dueAmount = Number(sale.dueAmount ?? sale.paymentDue ?? 0);
  const payments  = sale.payments ?? [];
  const dueDate   = payments.find((p) => p.dueDate)?.dueDate;

  if (dueAmount <= 0) {
    return { label: "Paid", className: "bg-green-100 text-green-800" };
  }
  if (!dueDate) {
    return { label: "Due", className: "bg-gray-100 text-gray-800" };
  }
  const due = new Date(dueDate);
  if (due < new Date()) {
    return { label: "Overdue", className: "bg-red-100 text-red-800" };
  }
  return { label: "Upcoming", className: "bg-blue-100 text-blue-800" };
}

// ── Column definitions ─────────────────────────────────────────────────────────

export const salesColumns: ColumnDef<Sale>[] = [
  {
    accessorKey: "invoiceNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Ref No{" "}
          {sort === "asc" ? <ArrowUp /> : sort === "desc" ? <ArrowDown /> : <ArrowUpDown />}
        </Button>
      );
    },
  },
  {
    accessorKey: "salesdate",
    header: "Date",
    cell: ({ row }) => {
      // API returns salesDate (Prisma field) — handle both cases
      const raw = (row.original as any).salesDate ?? row.getValue("salesdate");
      return <div>{raw ? formatDate(raw) : "—"}</div>;
    },
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => <span>{row.original.branch?.name ?? "—"}</span>,
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => <span>{row.original.customer?.name ?? "—"}</span>,
  },
  {
    id: "status",
    header: () => <div className="px-3 text-center">Status</div>,
    cell: ({ row }) => {
      const status = resolveOrderStatus(row.original);
      const colorMap: Record<string, string> = {
        Dispatched: "bg-green-100 text-green-800",
        Ordered:    "bg-yellow-100 text-yellow-800",
        Cancelled:  "bg-red-100 text-red-800",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
            colorMap[status] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const { label, className } = resolvePaymentStatus(row.original);
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${className}`}>
          {label}
        </span>
      );
    },
  },
  {
    id: "openingBalance",
    header: () => <div className="px-3 text-center">Opening Balance</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {formatCurrency(Number(row.original.customer?.openingBalance ?? 0))}
      </div>
    ),
  },
  {
    id: "paidAmount",
    header: () => <div className="px-3 text-center">Paid Amount</div>,
    cell: ({ row }) => {
      const paidAmount = Number((row.original as any).paidAmount ?? 0);
const paid = paidAmount || (row.original.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);
      return <div className="text-center font-medium">{formatCurrency(paid)}</div>;
    },
  },
  {
    id: "dueAmount",
    header: () => <div className="px-3 text-center">Due Amount</div>,
    cell: ({ row }) => {
      const due = Number(
        (row.original as any).dueAmount ?? row.original.paymentDue ?? 0
      );
      return (
        <div className={`text-center font-medium ${due > 0 ? "text-destructive" : ""}`}>
          {formatCurrency(due)}
        </div>
      );
    },
  },
  {
    accessorKey: "grandTotal",
    header: "Grand Total",
    cell: ({ row }) => (
      <div className="font-medium">
        {formatCurrency(Number(row.getValue("grandTotal")))}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="flex items-center justify-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-1">
        <ExportInvoiceButton data={row.original} type="sale" />
        <SalesActions sale={row.original} />
      </div>
    ),
  },
];

// ── Row actions component ──────────────────────────────────────────────────────

const SalesActions = ({ sale }: { sale: Sale }) => {
  const [openEdit,   setOpenEdit]   = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const router = useRouter();

  const { execute: updateStatus, isExecuting } = useAction(updateSalesStatus, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) {
        toast.error((data as any).error);
      } else {
        toast.success("Status updated");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const status = resolveOrderStatus(sale);

  return (
    <div className="flex items-center gap-1">
      {status === "Ordered" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateStatus({ id: sale.id, status: "Dispatched" })}
          disabled={isExecuting}
          className="h-8 gap-1 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
        >
          <Check className="h-3.5 w-3.5" />
          {isExecuting ? "…" : "Approve"}
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/sales/${sale.id}`)}
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

      <SalesFormSheet open={openEdit} openChange={setOpenEdit} sales={sale} />
      <SalesDeleteDialog sale={sale} open={openDelete} setOpen={setOpenDelete} />
    </div>
  );
};