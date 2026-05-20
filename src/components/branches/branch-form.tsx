'use client';
import { useEffect } from "react";
import { FormDialog, FormDialogContent, FormDialogDescription, FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger } from "@/components/common/form-dialog";
import { branchSchema } from "@/schemas/branch-schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogClose } from "../ui/dialog";
import { createBranch, updateBranch } from "@/actions/branch-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { BranchFormProps } from "@/types/branch";


export const BranchFormDialog = ({ branch, open, openChange }: BranchFormProps) => {

  const { execute: createProject, isExecuting: isCreating } = useAction(createBranch);
  const { execute: updateProject, isExecuting: isUpdating } = useAction(updateBranch);

  const form = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name || "",
      email: branch?.email || "",
      phone: branch?.phone || "",
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        email: branch.email || "",
        phone: branch.phone || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
      });
    }
  }, [branch, form]);

  const handleSubmit = async (
    data: z.infer<typeof branchSchema>,
    close: () => void,
  ) => {
    if (branch) {
      await updateProject({ id: branch.id, ...data });
      toast.success("Branch updated successfully");
    } else {
      await createProject(data);
      toast.success("Branch created successfully");
    }
    close();
  };

  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={handleSubmit}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Branch
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {branch ? "Edit Branch" : "New Branch"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the branch details. Click save when you&apos;re done.
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="Branch Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Phone Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormDialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Saving..." : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};
