"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FC } from "react";
import { Supplier } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { deleteSupplier } from "@/actions/supplier-action";
import { useRouter } from "next/navigation";

export const SupplierDeleteDialog: FC<{
  supplier: Supplier;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ supplier, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteSupplier({ id: supplier.id });
      toast.success(`Supplier "${supplier.name}" deleted.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete supplier.");
      console.error("Error on deleting supplier:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{supplier.name}</span> supplier.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
