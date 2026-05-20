'use client';
import { useEffect } from "react";
import { FormDialog, FormDialogContent, FormDialogDescription, FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger } from "@/components/common/form-dialog";
import { expenseCategorySchema } from "@/schemas/expense-category-schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogClose } from "../ui/dialog";
import { createExpenseCategory, updateExpenseCategory } from "@/actions/expense-category-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { ExpenseCategoryFormProps } from "@/types/expense-category";


export const ExpenseCategoryFormDialog = ({ expenseCategory, open, openChange }: ExpenseCategoryFormProps) => {

  const { execute: createProject, isExecuting: isCreating } = useAction(createExpenseCategory);
  const { execute: updateProject, isExecuting: isUpdating } = useAction(updateExpenseCategory);

  const form = useForm<z.infer<typeof expenseCategorySchema>>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: expenseCategory?.name || "",
    },
  });

  useEffect(() => {
    if (expenseCategory) {
      form.reset({
        name: expenseCategory.name,
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [expenseCategory, form]);

  const handleSubmit = async (
    data: z.infer<typeof expenseCategorySchema>,
    close: () => void,
  ) => {
    if (expenseCategory) {
      await updateProject({ id: expenseCategory.id, ...data });
      toast.success("Project updated successfully");
    } else {
      await createProject(data);
      toast.success("Project created successfully");
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
          New Expense Category
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {expenseCategory ? "Edit Expense Category" : "New Expense Category"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the expense category details. Click save when you&apos;re done.
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Expense Category Name" {...field} />
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
