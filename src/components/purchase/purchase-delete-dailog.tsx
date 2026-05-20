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
import { Purchase } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deletePurchase } from "@/actions/purchase-actions";
import { useRouter } from "next/navigation";

export const PurchaseDeleteDialog: FC<{
  purchase: Purchase;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ purchase, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deletePurchase({ id: purchase.id });
      toast.success(`Purchase "${purchase.supplierId}" deleted.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete purchase.");
      console.error("Error deleting purchase:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{purchase.referenceNo}</span> purchase.
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
