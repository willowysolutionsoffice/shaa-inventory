"use client";

import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogTrigger,
} from "@/components/common/form-dialog";
import { expenseSchema } from "@/schemas/expense-schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogClose } from "../ui/dialog";
import { createExpense, updateExpense } from "@/actions/expense-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { normalizeToUtcMidnight, getTodayUtcMidnight } from "@/lib/date-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getExpenseCategoryDropdown } from "@/actions/expense-category-action";
import { useEffect, useState } from "react";
import { ExpenseFormProps } from "@/types/expense";
import { getAllBranches } from "@/actions/auth";



export const ExpenseFormDialog = ({
  expense,
  open,
  openChange,
}: ExpenseFormProps) => {

  const { execute: createProject, isExecuting: isCreating } = useAction(createExpense);
  const { execute: updateProject, isExecuting: isUpdating } = useAction(updateExpense);

  const [expenseCategoryList, setExpenseCategoryList] = useState<{ name: string; id: string }[]>([])
  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>([]);



  useEffect(() => {
    const fetchOptions = async () => {
      const expenseCategory = await getExpenseCategoryDropdown()
      const branches = await getAllBranches()
      setBranchList(branches);
      setExpenseCategoryList(expenseCategory)
    };
    fetchOptions();
  }, [])



  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: expense?.title || "",
      branchId: expense?.branchId || "",
      description: expense?.description ?? "",
      amount: expense?.amount ?? undefined,
      date: normalizeToUtcMidnight(expense?.date),
      expenseCategoryId: expense?.expenseCategoryId || "",
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        title: expense.title,
        branchId: expense.branchId || "",
        description: expense.description ?? undefined,
        amount: expense.amount,
        date: expense.date ? new Date(expense.date) : new Date(),
        expenseCategoryId: expense.expenseCategoryId,
      });
    } else {
      form.reset({
        title: "",
        branchId: "",
        description: "",
        amount: undefined,
        date: getTodayUtcMidnight(),
        expenseCategoryId: "",
      });
    }
  }, [expense, form]);

  const handleSubmit = async (
    data: z.infer<typeof expenseSchema>,
    close: () => void,
  ) => {
    if (expense) {
      await updateProject({ id: expense.id, ...data });
      toast.success("Expense updated successfully");
    } else {
      await createProject(data);
      toast.success("Expense created successfully");
    }
    close();
  };

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          New Expense
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{expense ? "Edit Expense" : "New Expense"}</FormDialogTitle>
          <FormDialogDescription>
            Fill out the expense details. Click save when youre done.
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField control={form.control} name="branchId" render={({ field }) => (
          <FormItem>
            <FormLabel>Business Location</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Branch" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {baranchList.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* expense Name */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Expense Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Input placeholder="description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? formatDate(field.value)
                        : "Pick a date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(d) => field.onChange(normalizeToUtcMidnight(d))}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="expenseCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Expense Category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategoryList.map((expenseCategory) => (
                    <SelectItem key={expenseCategory?.id} value={expenseCategory?.id}>
                      {expenseCategory?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
