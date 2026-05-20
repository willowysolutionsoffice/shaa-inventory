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
import { Product } from "@/types/product";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/product-actions";
import { useRouter } from "next/navigation";

export const ProductDeleteDialog:FC<{
  product: Product,
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({product, open, setOpen}) => {
    const router = useRouter()
  const handleDelete = async () => {
    try{
        await deleteProduct({ id : product.id});
        toast.success(`Product "${product.product_name}" deleted.`)
        setOpen(!open)
        router.refresh()
    }catch(error){
        toast.error("Failed to delete product.")
        console.log(error,"Error on deleting product");
        
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{product.product_name}</span> product
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
