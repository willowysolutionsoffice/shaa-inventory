"use client";

import { FC, useEffect, useState } from "react";
import { BalancePayment } from "@prisma/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { getBalancePayments } from "@/actions/balance-payment-action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { CURRENCY_SYMBOL, formatDate } from "@/lib/utils";

export const CustomerHistoryListDialog: FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  customerId?: string;
}> = ({ open, setOpen, customerId }) => {
  const [payments, setPayments] = useState<BalancePayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !customerId) return;
    const fetch = async () => {
      setLoading(true);
      const result = await getBalancePayments({ customerId });

      if (Array.isArray(result?.data?.data)) {
        setPayments(result.data.data);
      } else {
        toast.error("Failed to load payments");
      }
      setLoading(false);
    };
    fetch();
  }, [open, customerId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments found.</p>
          ) : (
            <Card className="h-80 border-none shadow-none">
              <div className="h-full overflow-y-auto pr-2 py-2 space-y-4">
                {payments.map((payment, index) => (
                  <div key={payment.id} className="space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-primary text-base">
                        {CURRENCY_SYMBOL}{payment.amount}
                      </p>
                      <p className="text-xs text-muted-foreground text-right">
                        {formatDate(payment.paidOn)} • {payment.method}
                      </p>
                    </div>
                    {payment.note && (
                      <p className="text-sm text-muted-foreground">{payment.note}</p>
                    )}
                    {index !== payments.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
