"use client";

import {
  FormDialog, FormDialogContent, FormDialogDescription,
  FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger,
} from "@/components/common/form-dialog";
import { expenseSchema } from "@/schemas/expense-schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createExpense, updateExpense } from "@/actions/expense-actions";
import { getExpenseCategoryDropdown } from "@/actions/expense-category-action";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { normalizeToUtcMidnight, getTodayUtcMidnight } from "@/lib/date-utils";
import { ExpenseFormProps } from "@/types/expense";

type ExpenseForm = z.infer<typeof expenseSchema>;

export const ExpenseFormDialog = ({ expense, open, openChange }: ExpenseFormProps) => {
  const { execute: create, isExecuting: isCreating } = useAction(createExpense, {
    onSuccess: () => { toast.success(expense ? "Expense updated" : "Expense created"); },
    onError:   () => toast.error("Failed to save expense"),
  });
  const { execute: update, isExecuting: isUpdating } = useAction(updateExpense, {
    onSuccess: () => toast.success("Expense updated"),
    onError:   () => toast.error("Failed to update expense"),
  });

  const [categoryList, setCategoryList] = useState<{ id: string; name: string }[]>([]);
  const [branchList,   setBranchList]   = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cats, branches] = await Promise.all([
        getExpenseCategoryDropdown(),
        getBranchListForDropdown(),
      ]);
      setCategoryList(cats);
      setBranchList(branches);
    };
    load();
  }, []);

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title:       expense?.title       ?? "",
      branchId:    expense?.branchId    ?? "",
      description: expense?.description ?? "",
      amount:      expense?.amount      ?? 0,
      expenseDate: expense?.expenseDate
        ? new Date(expense.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      categoryId:  expense?.categoryId  ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      title:       expense?.title       ?? "",
      branchId:    expense?.branchId    ?? "",
      description: expense?.description ?? "",
      amount:      expense?.amount      ?? 0,
      expenseDate: expense?.expenseDate
        ? new Date(expense.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      categoryId:  expense?.categoryId  ?? "",
    });
  }, [expense, form]);

  const handleSubmit = async (data: ExpenseForm, close: () => void) => {
    if (expense) {
      update({ id: expense.id, ...data });
    } else {
      create(data);
    }
    close();
  };

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      {!open && (
        <FormDialogTrigger asChild>
          <Button><Plus className="size-4 mr-2" />New Expense</Button>
        </FormDialogTrigger>
      )}

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{expense ? "Edit Expense" : "New Expense"}</FormDialogTitle>
          <FormDialogDescription>Fill out the expense details.</FormDialogDescription>
        </FormDialogHeader>

        <FormField control={form.control} name="branchId" render={({ field }) => (
          <FormItem>
            <FormLabel>Business Location</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Branch" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {branchList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input placeholder="Expense title" {...field} /></FormControl>
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

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="expenseDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={cn("w-full text-left", !field.value && "text-muted-foreground")}>
                    {field.value ? formatDate(new Date(field.value)) : "Pick a date"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(d) => field.onChange(d ? normalizeToUtcMidnight(d).toISOString().split('T')[0] : "")}
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="categoryId" render={({ field }) => (
          <FormItem>
            <FormLabel>Expense Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {categoryList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
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