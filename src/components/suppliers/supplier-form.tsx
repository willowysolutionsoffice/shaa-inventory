'use client';

import {
  FormDialog, FormDialogContent, FormDialogDescription,
  FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger,
} from "@/components/common/form-dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { createSupplier, updateSupplier } from "@/actions/supplier-action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { SupplierFormProps } from "@/types/supplier";
import { useEffect, useRef, useState } from "react";

const supplierSchema = z.object({
  SupplierId:        z.string().min(1, 'Supplier ID is required'),
  name:              z.string().min(1, 'Name is required'),
  email:             z.string().optional(),
  phone:             z.string().optional(),
  address:           z.string().optional(),
  openingBalance:    z.coerce.number().optional().default(0),
  branchId:          z.string().min(1, 'Branch is required'),
  accountHolderName: z.string().optional(),
  bankName:          z.string().optional(),
  bankBranchName:    z.string().optional(),
  accountNumber:     z.string().optional(),
  ifscCode:          z.string().optional(),
  upiId:             z.string().optional(),
  bankNotes:         z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormDialogProps extends SupplierFormProps {
  branches: { name: string; id: string }[];
}

const EMPTY_VALUES: SupplierFormValues = {
  SupplierId: "", branchId: "", name: "", email: "", phone: "",
  address: "", openingBalance: 0,
  accountHolderName: "", bankName: "", bankBranchName: "",
  accountNumber: "", ifscCode: "", upiId: "", bankNotes: "",
};

export const SupplierFormDialog = ({ supplier, open, openChange, branches }: SupplierFormDialogProps) => {
  const [showBanking, setShowBanking] = useState(false);
  const closeRef = useRef<() => void>(() => {});  // ✅ holds the close fn

  const { execute: createAction, isExecuting: isCreating } = useAction(createSupplier, {
    onSuccess: ({ data }) => {
      if (data?.data) { toast.success("Supplier created successfully"); closeRef.current(); }
      else if (data?.error) toast.error(data.error);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create supplier"),
  });

  const { execute: updateAction, isExecuting: isUpdating } = useAction(updateSupplier, {
    onSuccess: ({ data }) => {
      if (data?.data) { toast.success("Supplier updated successfully"); closeRef.current(); }
      else if (data?.error) toast.error(data.error);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update supplier"),
  });

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    form.reset(supplier ? {
      SupplierId:        supplier.SupplierId        ?? "",
      branchId:          supplier.branchId          ?? "",
      name:              supplier.name              ?? "",
      email:             supplier.email             ?? "",
      phone:             supplier.phone             ?? "",
      address:           supplier.address           ?? "",
      openingBalance:    supplier.openingBalance    ?? 0,
      accountHolderName: supplier.accountHolderName ?? "",
      bankName:          supplier.bankName          ?? "",
      bankBranchName:    supplier.bankBranchName    ?? "",
      accountNumber:     supplier.accountNumber     ?? "",
      ifscCode:          supplier.ifscCode          ?? "",
      upiId:             supplier.upiId             ?? "",
      bankNotes:         supplier.bankNotes         ?? "",
    } : EMPTY_VALUES);
    if (supplier?.bankName || supplier?.accountNumber || supplier?.upiId) {
      setShowBanking(true);
    } else {
      setShowBanking(false);
    }
  }, [supplier, form]);

  // ✅ Capture close before firing async action
  const handleSubmit = (data: SupplierFormValues, close: () => void) => {
    closeRef.current = close;
    if (supplier) updateAction({ id: supplier.id, ...data });
    else createAction(data);
  };

  const isBusy = isCreating || isUpdating;

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      {!supplier && (
        <FormDialogTrigger asChild>
          <Button><Plus className="size-4" />New Supplier</Button>
        </FormDialogTrigger>
      )}

      <FormDialogContent className="sm:max-w-lg">

        <FormDialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <FormDialogTitle>{supplier ? "Edit Supplier" : "New Supplier"}</FormDialogTitle>
          <FormDialogDescription>Fill out the supplier details. Click save when done.</FormDialogDescription>
        </FormDialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">

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
                <Input type="number" placeholder="0.00" {...field} value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))} />
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
            <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea placeholder="Supplier Address" {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowBanking((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>Banking Information (Optional)</span>
              {showBanking ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>

            {showBanking && (
              <div className="px-4 pb-4 pt-2 space-y-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                    <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="Full name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. SBI" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="bankBranchName" render={({ field }) => (
                    <FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input placeholder="Bank branch" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ifscCode" render={({ field }) => (
                    <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="e.g. SBIN0001234" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="accountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="Account number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="upiId" render={({ field }) => (
                    <FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input placeholder="name@bank" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="bankNotes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any additional banking notes" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}
          </div>

        </div>

        <FormDialogFooter className="px-6 py-4 shrink-0 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isBusy}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Saving..." : "Save"}
          </Button>
        </FormDialogFooter>

      </FormDialogContent>
    </FormDialog>
  );
};