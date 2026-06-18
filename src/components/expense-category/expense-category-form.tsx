"use client";

import {
  FormDialog, FormDialogContent, FormDialogDescription,
  FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger,
} from "@/components/common/form-dialog";
import { expenseCategorySchema } from "@/schemas/expense-category-schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { createExpenseCategory, updateExpenseCategory } from "@/actions/expense-category-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useEffect } from "react";
import { ExpenseCategoryFormProps } from "@/types/expense";

type CategoryForm = z.infer<typeof expenseCategorySchema>;

export const ExpenseCategoryFormDialog = ({ expenseCategory, open, openChange }: ExpenseCategoryFormProps) => {
  const { execute: create, isExecuting: isCreating } = useAction(createExpenseCategory, {
    onSuccess: () => toast.success(expenseCategory ? "Category updated" : "Category created"),
    onError:   () => toast.error("Failed to save category"),
  });
  const { execute: update, isExecuting: isUpdating } = useAction(updateExpenseCategory, {
    onSuccess: () => toast.success("Category updated"),
    onError:   () => toast.error("Failed to update category"),
  });

  const form = useForm<CategoryForm>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name:        expenseCategory?.name        ?? "",
      description: expenseCategory?.description ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name:        expenseCategory?.name        ?? "",
      description: expenseCategory?.description ?? "",
    });
  }, [expenseCategory, form]);

  const handleSubmit = (data: CategoryForm, close: () => void) => {
    if (expenseCategory) {
      update({ id: expenseCategory.id, ...data });
    } else {
      create(data);
    }
    close();
  };

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      {!open && (
        <FormDialogTrigger asChild>
          <Button><Plus className="size-4 mr-1" />New Expense Category</Button>
        </FormDialogTrigger>
      )}

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{expenseCategory ? "Edit Category" : "New Expense Category"}</FormDialogTitle>
          <FormDialogDescription>Fill out the category details.</FormDialogDescription>
        </FormDialogHeader>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="Category name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl><Input placeholder="Description" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating || isUpdating}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Saving..." : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};