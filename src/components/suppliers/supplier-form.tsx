'use client';

import { FormDialog, FormDialogContent, FormDialogDescription, FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger } from "@/components/common/form-dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { createSupplier, updateSupplier } from "@/actions/supplier-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { SupplierFormProps } from "@/types/supplier";
import { Textarea } from "../ui/textarea";
import { useEffect } from "react";

const supplierSchema = z.object({
  SupplierId:     z.string().min(1, 'Supplier ID is required'),
  name:           z.string().min(1, 'Name is required'),
  email:          z.string().optional(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  openingBalance: z.coerce.number().optional().default(0),
  branchId:       z.string().min(1, 'Branch is required'),
});

interface SupplierFormDialogProps extends SupplierFormProps {
  branches: { name: string; id: string }[];
}

export const SupplierFormDialog = ({ supplier, open, openChange, branches }: SupplierFormDialogProps) => {
  const { execute: createAction, isExecuting: isCreating } = useAction(createSupplier, {
    onSuccess: ({ data }) => {
      if (data?.data) { toast.success("Supplier created successfully"); openChange?.(false); }
      else if (data?.error) toast.error(data.error);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create supplier"),
  });

  const { execute: updateAction, isExecuting: isUpdating } = useAction(updateSupplier, {
    onSuccess: ({ data }) => {
      if (data?.data) { toast.success("Supplier updated successfully"); openChange?.(false); }
      else if (data?.error) toast.error(data.error);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update supplier"),
  });

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      SupplierId: "", branchId: "", name: "", email: "", phone: "", address: "", openingBalance: 0,
    },
  });

  useEffect(() => {
    form.reset(supplier ? {
      SupplierId:     supplier.SupplierId     ?? "",
      branchId:       supplier.branchId       ?? "",
      name:           supplier.name           ?? "",
      email:          supplier.email          ?? "",
      phone:          supplier.phone          ?? "",
      address:        supplier.address        ?? "",
      openingBalance: supplier.openingBalance ?? 0,
    } : { SupplierId: "", branchId: "", name: "", email: "", phone: "", address: "", openingBalance: 0 });
  }, [supplier, form]);

  const handleSubmit = (data: z.infer<typeof supplierSchema>) => {
    if (supplier) updateAction({ id: supplier.id, ...data });
    else createAction(data);
  };

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      {!supplier && (
        <FormDialogTrigger asChild>
          <Button><Plus className="size-4" />New Supplier</Button>
        </FormDialogTrigger>
      )}
      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{supplier ? "Edit Supplier" : "New Supplier"}</FormDialogTitle>
          <FormDialogDescription>Fill out the supplier details. Click save when done.</FormDialogDescription>
        </FormDialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="SupplierId" render={({ field }) => (
            <FormItem><FormLabel>Supplier ID</FormLabel><FormControl><Input placeholder="S0001" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Supplier Name" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="Phone number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input placeholder="Email address" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="openingBalance" render={({ field }) => (
            <FormItem><FormLabel>Opening Balance</FormLabel><FormControl>
              <Input type="number" placeholder="000.00" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(Number(e.target.value))} />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="branchId" render={({ field }) => (
            <FormItem><FormLabel>Business Location</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select Branch" /></SelectTrigger></FormControl>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea placeholder="Address" {...field} /></FormControl><FormMessage /></FormItem>
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