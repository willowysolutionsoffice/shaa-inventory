// src/components/sales/pos-held-bills.tsx
"use client";

import React, { memo } from "react";
import { PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { HeldBill } from "./pos-types";

interface HeldBillsCardProps {
  heldBills: HeldBill[];
  restoreBill: (id: string) => void;
}

export const HeldBillsCard = memo(function HeldBillsCard({
  heldBills,
  restoreBill,
}: HeldBillsCardProps) {
  if (heldBills.length === 0) return null;

  return (
    <Card className="border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 dark:border-yellow-900/30">
      <CardHeader className="py-2.5 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-yellow-800 dark:text-yellow-400">
          <PauseCircle className="h-4 w-4" /> Held Transactions (
          {heldBills.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2 flex flex-wrap gap-2">
        {heldBills.map((h) => (
          <Button
            key={h.id}
            variant="outline"
            size="sm"
            className="border-yellow-300 bg-card hover:bg-yellow-100 hover:text-yellow-900 dark:border-yellow-800"
            onClick={() => restoreBill(h.id)}
          >
            {h.id}
            <span className="text-[10px] opacity-75 font-normal ml-2">
              ({formatCurrency(h.subtotal)})
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});
