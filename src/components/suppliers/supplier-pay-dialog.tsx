"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { FormProvider, useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { FC } from "react";
import { SupplierRow } from "@/types/supplier";
import { createBalancePayment } from "@/actions/balance-payment-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { balancePaymentSchema } from "@/schemas/balance-payment-schema";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { Card } from "../ui/card";
import { CURRENCY_SYMBOL, formatDate } from "@/lib/utils";

export const SupplierPayDialog: FC<{
  supplier: SupplierRow;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ supplier, open, setOpen }) => {
  const isControlled = typeof open === "boolean";
  const { execute: create, isExecuting: isCreating } = useAction(createBalancePayment);

  const form = useForm<z.infer<typeof balancePaymentSchema>>({
    resolver: zodResolver(balancePaymentSchema),
    defaultValues: {
      amount: undefined,
      method: "cash",
      paidOn: new Date(),
      note: "",
      supplierId: supplier.id,
    },
  });

  const handleSubmit = async (data: z.infer<typeof balancePaymentSchema>) => {
  const result = await create(data);
  if (result?.data?.data || result?.data?.error === undefined) {
    toast.success("Balance payment added successfully");
    form.reset();
    setOpen(false);
  } else {
    toast.error("Failed to save balance payment");
  }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Card className="p-4 space-y-4">
              <p><strong>Supplier name:</strong> {supplier.name}</p>
              {(() => {
                let effectiveOpening = supplier.openingBalance ?? 0;
                let effectivePurchaseDue = supplier.purchaseDue ?? 0;
                if (effectivePurchaseDue < 0) {
                  effectiveOpening = Math.max(0, effectiveOpening + effectivePurchaseDue);
                  effectivePurchaseDue = 0;
                }
                return (
                  <>
                    <p><strong>Total Purchase Due:</strong> {CURRENCY_SYMBOL}{effectivePurchaseDue.toFixed(2)}</p>
                    <p><strong>Opening Balance:</strong> {CURRENCY_SYMBOL}{effectiveOpening.toFixed(2)}</p>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2 text-primary">
                      <span>Total Current Due:</span>
                      <span>{CURRENCY_SYMBOL}{((supplier.purchaseDue ?? 0) + (supplier.openingBalance ?? 0)).toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full text-left">
                            {field.value ? formatDate(field.value) : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter payment note..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
