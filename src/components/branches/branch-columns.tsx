"use client";

import { Branch } from "@prisma/client";
import { BranchFormDialog } from "./branch-form";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BranchDeleteDialog } from "./branch-delete-dailog";
import { useState } from "react";

export const branchColumns: ColumnDef<Branch>[] = [
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
          Name {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) => <div className="px-3">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: () => <div className="px-3 text-center">Phone</div>,
    cell: ({ row }) => (
      <div className="flex justify-center px-3">{row.getValue("phone")}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="px-3 text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-center px-3">
        <BranchActions branch={row.original} />
      </div>
    ),
  },
];

export const BranchActions = ({ branch }: { branch: Branch }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

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

      {/* Edit Dialog */}
      <BranchFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        branch={branch}
      />

      {/* Delete Dialog */}
      <BranchDeleteDialog
        branch={branch}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};
