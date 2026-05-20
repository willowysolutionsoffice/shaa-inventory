'use client';
import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogTrigger,
} from "@/components/common/form-dialog";
import { customerSchema } from "@/schemas/customer-schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"
import { DialogClose } from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "@/actions/customer-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { CustomerFormProps } from "@/types/customer";
import { useEffect, useState } from "react";
import { getAllBranches } from "@/actions/auth";

interface CustomerFormDialogProps extends CustomerFormProps {
  branches: { name: string; id: string }[];
}

export const CustomerFormDialog = ({ customer, open, openChange, branches }: CustomerFormDialogProps) => {
  const [baranchList, setBranchList] = useState<{ name: string; id: string; }[]>(branches);
  const { execute: createCustomerAction, isExecuting: isCreating } = useAction(createCustomer, {
    onSuccess: ({ data }) => {
      if (data?.data) {
        toast.success("Customer created successfully");
        if (openChange) openChange(false);
      } else if (data?.error) {
        toast.error(data.error || "Failed to create customer");
      }
    },
    onError: ({ error }) => {
      console.error("Create customer error:", error);
      toast.error(error.serverError || "Failed to create customer");
    },
  });

  const { execute: updateCustomerAction, isExecuting: isUpdating } = useAction(updateCustomer, {
    onSuccess: ({ data }) => {
      if (data?.data) {
        toast.success("Customer updated successfully");
        if (openChange) openChange(false);
      } else if (data?.error) {
        toast.error(data.error || "Failed to update customer");
      }
    },
    onError: ({ error }) => {
      console.error("Update customer error:", error);
      toast.error(error.serverError || "Failed to update customer");
    },
  });

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      CustomerID: customer?.CustomerID || "",
      name: customer?.name || "",
      branchId: customer?.branchId || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      openingBalance: customer?.openingBalance || undefined,
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        CustomerID: customer.CustomerID,
        name: customer.name,
        branchId: customer.branchId || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        openingBalance: customer.openingBalance ?? undefined,
      });
    } else {
      form.reset({
        CustomerID: "",
        name: "",
        branchId: "",
        email: "",
        phone: "",
        address: "",
        openingBalance: undefined,
      });
    }
  }, [customer, form]);

  const handleSubmit = (
    data: z.infer<typeof customerSchema>,
    close: () => void
  ) => {
    if (customer) {
      updateCustomerAction({ id: customer.id, ...data });
    } else {
      createCustomerAction(data);
    }
  };

  // Removed useEffect fetchOptions for branches as they are passed via props

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Customer
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {customer ? "Edit Customer" : "New Customer"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the customer details. Click save when you done.
          </FormDialogDescription>
        </FormDialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="CustomerID"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer ID</FormLabel>
                <FormControl>
                  <Input placeholder="C0001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Customer Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Email address" {...field} />
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
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">

          <FormField
            control={form.control}
            name="openingBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Balance</FormLabel>
                <FormControl>
                  <Input type="number"
                    placeholder="000.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating || isUpdating}>
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
