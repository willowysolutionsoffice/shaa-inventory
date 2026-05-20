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
import { Customer } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { deleteCustomer } from "@/actions/customer-action";
import { useRouter } from "next/navigation";

export const CustomersDeleteDialog: FC<{
  customer: Customer;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ customer, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteCustomer({ id: customer.id });
      toast.success(`Customer "${customer.name}" deleted.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete customer.");
      console.error("Error on deleting customer:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{customer.name}</span> customer.
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
