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
import { Brand } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { deleteBrand } from "@/actions/brand-actions";
import { useRouter } from "next/navigation";



export const BrandsDeleteDialog:FC<{
  brand: Brand,
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({brand, open, setOpen}) => {
    const router = useRouter()
  const handleDelete = async () => {
    try{
        await deleteBrand({ id : brand.id});
        toast.success(`Brand "${brand.name}" deleted.`)
        setOpen(!open)
        router.refresh()
    }catch(error){
        toast.error("Failed to delete brand.")
        console.log(error,"Error on deleting brands");
        
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{brand.name}</span> brand
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
            variant="destructive"
            onClick={handleDelete}>Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
