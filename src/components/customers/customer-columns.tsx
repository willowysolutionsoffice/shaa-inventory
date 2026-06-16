"use client";

// src/components/customers/customer-columns.tsx

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerFormDialog } from "./customer-form";
import { CustomersDeleteDialog } from "./customer-delete-dailog";
import { Customer } from "@/types/customer";

export const customersColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Name{" "}
          {sort === "asc" ? <ArrowUp className="size-4" /> : sort === "desc" ? <ArrowDown className="size-4" /> : <ArrowUpDown className="size-4" />}
        </Button>
      );
    },
    cell: ({ row }) => <div className="px-3 font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: () => <div className="px-3">Email</div>,
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email") || "—"}</div>,
  },
  {
    accessorKey: "phone",
    header: () => <div className="px-3">Phone</div>,
    cell: ({ row }) => <div>{row.getValue("phone") || "—"}</div>,
  },
  {
    id: "branch",
    header: "Branch",
    cell: ({ row }) => <div>{(row.original as any).branch?.name ?? "—"}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <CustomerActions
          customer={row.original}
          branches={meta?.branches ?? []}
        />
      );
    },
  },
];

interface CustomerActionsProps {
  customer: Customer;
  branches: { name: string; id: string }[];
}

const CustomerActions = ({ customer, branches }: CustomerActionsProps) => {
  const router = useRouter();
  const [openEdit,   setOpenEdit]   = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Purchase history & rewards */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/customers/${customer.id}`)}
        className="h-8 w-8 p-0 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
        title="Purchase History & Rewards"
      >
        <History className="h-4 w-4" />
      </Button>

      {/* Edit */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 p-0"
        title="Edit Customer"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenDelete(true)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0"
        title="Delete Customer"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <CustomerFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        customer={customer}
        branches={branches}
      />

      <CustomersDeleteDialog
        customer={customer}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};