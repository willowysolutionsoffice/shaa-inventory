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
import { Branch } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { deleteBranch } from "@/actions/branch-action";
import { useRouter } from "next/navigation";



export const BranchDeleteDialog:FC<{
  branch: Branch,
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({branch, open, setOpen}) => {
    const router = useRouter()
  const handleDelete = async () => {
    try{
        await deleteBranch({ id : branch.id});
        toast.success(`Branch "${branch.name}" deleted.`)
        setOpen(!open)
        router.refresh()
    }catch(error){
        toast.error("Failed to delete branch.")
        console.log(error,"Error on deleting branches");
        
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{branch.name}</span> branch
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
