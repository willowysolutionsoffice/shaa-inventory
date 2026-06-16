'use client';

// src/components/customers/customer-form.tsx

import {
  FormDialog, FormDialogContent, FormDialogDescription,
  FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger,
} from "@/components/common/form-dialog";
import { customerSchema } from "@/schemas/customer-schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "@/actions/customer-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { CustomerFormProps } from "@/types/customer";
import { useEffect } from "react";

interface CustomerFormDialogProps extends CustomerFormProps {
  branches: { name: string; id: string }[];
}

export const CustomerFormDialog = ({ customer, open, openChange, branches }: CustomerFormDialogProps) => {
  const { execute: createAction, isExecuting: isCreating } = useAction(createCustomer, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success("Customer created successfully");
      openChange?.(false);
    },
    onError: () => toast.error("Failed to create customer"),
  });

  const { execute: updateAction, isExecuting: isUpdating } = useAction(updateCustomer, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success("Customer updated successfully");
      openChange?.(false);
    },
    onError: () => toast.error("Failed to update customer"),
  });

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name:     customer?.name     ?? "",
      email:    customer?.email    ?? "",
      phone:    customer?.phone    ?? "",
      branchId: customer?.branchId ?? "",
    },
  });

  // Reset form when customer prop changes (edit mode)
  useEffect(() => {
    form.reset({
      name:     customer?.name     ?? "",
      email:    customer?.email    ?? "",
      phone:    customer?.phone    ?? "",
      branchId: customer?.branchId ?? "",
    });
  }, [customer, form]);

  const handleSubmit = (data: z.infer<typeof customerSchema>) => {
    if (customer) {
      updateAction({ id: customer.id, ...data });
    } else {
      createAction(data);
    }
  };

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      {/* Only show trigger button when not controlled externally */}
      {openChange === undefined && (
        <FormDialogTrigger asChild>
          <Button>
            <Plus className="size-4" /> New Customer
          </Button>
        </FormDialogTrigger>
      )}

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{customer ? "Edit Customer" : "New Customer"}</FormDialogTitle>
          <FormDialogDescription>
            Fill out the customer details below.
          </FormDialogDescription>
        </FormDialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Customer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} value={field.value ?? ""} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Branch */}
          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Location</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating || isUpdating}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Saving…" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};