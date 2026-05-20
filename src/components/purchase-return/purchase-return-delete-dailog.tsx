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
import { PurchaseReturn } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deletePurchaseReturn } from "@/actions/purchase-return-action";
import { useRouter } from "next/navigation";

export const PurchaseReturnDeleteDialog: FC<{
  purchaseReturn: PurchaseReturn;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ purchaseReturn, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deletePurchaseReturn({ id: purchaseReturn.id });
      toast.success(`Purchase return "${purchaseReturn.referenceNo}" deleted.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete purchase return.");
      console.error("Error deleting purchase return:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{purchaseReturn.referenceNo}</span> purchase return.
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
