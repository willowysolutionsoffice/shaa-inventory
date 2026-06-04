"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { updateGRNStatus } from "@/actions/grn-action";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";

type GRNRow = {
  id: string;
  grnNo: string;
  receivedDate: Date;
  status: "Draft" | "Verified" | "Rejected";
  notes?: string;
  supplier: { name: string } | null;
  branch: { name: string } | null;
  purchase: { purchaseNo?: string; referenceNo?: string } | null;
  items: { orderedQty: number; receivedQty: number; total: number }[];
};

const STATUS_STYLES: Record<string, string> = {
  Verified: "bg-green-100 text-green-800",
  Draft:    "bg-yellow-100 text-yellow-800",
  Rejected: "bg-red-100 text-red-800",
};

export const grnColumns: ColumnDef<GRNRow>[] = [
  {
    accessorKey: "grnNo",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          GRN No {sort === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : sort === "desc" ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3" />}
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold text-purple-600">{row.getValue("grnNo")}</span>
    ),
  },
  {
    accessorKey: "receivedDate",
    header: () => <div className="text-center">Received Date</div>,
    cell: ({ row }) => (
      <div className="text-center text-sm">{formatDate(row.getValue("receivedDate"))}</div>
    ),
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) => <span className="text-sm">{row.original.supplier?.name ?? "—"}</span>,
  },
  {
    id: "branch",
    header: "Branch",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.branch?.name ?? "—"}</span>,
  },
  {
    id: "items",
    header: () => <div className="text-center">Items</div>,
    cell: ({ row }) => (
      <div className="text-center text-sm">{row.original.items.length}</div>
    ),
  },
  {
    id: "totalValue",
    header: () => <div className="text-right">Total Value</div>,
    cell: ({ row }) => {
      const total = row.original.items.reduce((s, i) => s + i.total, 0);
      return <div className="text-right font-medium">{formatCurrency(total)}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"}`}>
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => <GRNActions grn={row.original} />,
  },
];

function GRNActions({ grn }: { grn: GRNRow }) {
  const router = useRouter();
  const { execute, isExecuting } = useAction(updateGRNStatus, {
    onSuccess: ({ data }) => {
      if (data && "error" in data) toast.error(data.error);
      else toast.success("GRN status updated");
    },
    onError: () => toast.error("Something went wrong"),
  });

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="View GRN"
        onClick={() => router.push(`/admin/grn/${grn.id}`)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      {grn.status === "Draft" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Verify GRN"
            disabled={isExecuting}
            onClick={() => execute({ id: grn.id, status: "Verified" })}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Reject GRN"
            disabled={isExecuting}
            onClick={() => execute({ id: grn.id, status: "Rejected" })}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}