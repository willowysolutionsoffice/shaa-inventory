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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteSalesReturn } from "@/actions/sales-return-action";
import { SalesReturn } from "@/types/sales-return"; // adjust if needed

export const SalesReturnDeleteDialog: FC<{
  salesReturn: SalesReturn;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ salesReturn, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteSalesReturn({ id: salesReturn.id });
      toast.success(`Sales return "${salesReturn.invoiceNo}" deleted.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete sales return.");
      console.error("Error deleting sales return:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{salesReturn.invoiceNo}</span> sales return.
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
