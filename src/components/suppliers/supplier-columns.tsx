"use client";

import { Supplier } from "@prisma/client";
import { SupplierFormDialog } from "./supplier-form";
import { SupplierDeleteDialog } from "./supplier-delete-dailog";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock1,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SupplierPayDialog } from "./supplier-pay-dialog";
import { IconCash } from "@tabler/icons-react";
import { SupplierPaymentHistoryModal } from "./supplier-payment-history-modal";
import { formatCurrency } from "@/lib/utils";

export const supplierColumns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "SupplierId",
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
          Supplier Id
          {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="px-3">{row.getValue("SupplierId") as string}</div>
    ),
  },
  {
    accessorKey: "name",
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
          Name
          {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="px-3">{row.getValue("name") as string}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: () => <div className="px-3 text-center">Phone</div>,
    cell: ({ row }) => <div>{row.getValue("phone")}</div>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => <div>{row.getValue("address")}</div>,
  },
  {
    accessorKey: "openingBalance",
    header: "Opening Bal",
    cell: ({ row }) => {
      const amount = row.getValue("openingBalance") as number;
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: "purchaseDue",
    header: "Purchase Due",
    cell: ({ row }) => {
      const amount = row.getValue("purchaseDue") as number;
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: "purchaseReturnDue",
    header: "Purchase Return Due",
    cell: ({ row }) => {
      const amount = row.getValue("purchaseReturnDue") as number;
      return (
        <div className="text-center font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return row.original && (
        <SupplierActions
          supplier={row.original}
          branches={meta?.branches || []}
        />
      );
    },
  },
];

interface SupplierActionsProps {
  supplier: Supplier;
  branches: { name: string; id: string }[];
}

export const SupplierActions = ({ supplier, branches }: SupplierActionsProps) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenPay(true)}
        className="h-8 w-8 p-0"
      >
        <IconCash className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenPayment(true)}
        className="h-8 w-8 p-0"
      >
        <Clock1 className="h-4 w-4" />
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

      <SupplierFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        supplier={supplier}
        branches={branches}
      />

      <SupplierPayDialog
        supplier={supplier}
        open={openPay}
        setOpen={setOpenPay}
      />

      <SupplierPaymentHistoryModal
        open={openPayment}
        onOpenChange={setOpenPayment}
        supplierId={supplier?.id}
        supplierName={supplier?.name}
      />

      <SupplierDeleteDialog
        supplier={supplier}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};
