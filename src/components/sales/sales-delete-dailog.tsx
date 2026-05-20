"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { FC } from "react";
import { Sale } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteSale } from "@/actions/sales-action";
import { useRouter } from "next/navigation";

export const SalesDeleteDialog: FC<{
  sale: Sale;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ sale, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteSale({ id: sale.id });
      toast.success(`Sale "${sale.invoiceNo}" deleted.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete sales.");
      console.error("Error deleting sales:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{sale.invoiceNo}</span> sales.
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
