"use client";

import { useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { createGRN } from "@/actions/grn-action";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, PackageCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Purchase = {
  id: string;
  purchaseNo?: string;
  referenceNo?: string;
  supplierId: string;
  supplier?: { name: string };
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: { product_name: string; sku: string };
  }[];
};

interface Props {
  purchases: Purchase[];
}

export function GRNCreateForm({ purchases }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const selectedPO = purchases.find((p) => p.id === selectedPOId);

  // Reset received qtys when PO changes, defaulting to ordered qty
  useEffect(() => {
    if (selectedPO) {
      const defaults: Record<string, number> = {};
      selectedPO.items.forEach((item) => {
        defaults[item.productId] = item.quantity;
      });
      setReceivedQtys(defaults);
    }
  }, [selectedPOId]);

  const { execute, isExecuting } = useAction(createGRN, {
    onSuccess: ({ data }) => {
      if (data && "error" in data) {
        toast.error(data.error as string);
      } else {
        toast.success("GRN created successfully");
        setOpen(false);
        setSelectedPOId("");
        setNotes("");
        setReceivedQtys({});
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleSubmit = () => {
    if (!selectedPO) return;
    execute({
      purchaseId: selectedPOId,
      notes,
      items: selectedPO.items.map((item) => ({
        productId: item.productId,
        orderedQty: item.quantity,
        receivedQty: receivedQtys[item.productId] ?? item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  const totalOrdered  = selectedPO?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const totalReceived = selectedPO?.items.reduce((s, i) => s + (receivedQtys[i.productId] ?? i.quantity), 0) ?? 0;
  const hasShortfall  = totalReceived < totalOrdered;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create GRN
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Create Goods Receipt Note
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">

          {/* Step 1 — Select PO */}
          <div className="space-y-2">
            <Label>Select Purchase Order *</Label>
            <Select value={selectedPOId} onValueChange={setSelectedPOId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a purchase order..." />
              </SelectTrigger>
              <SelectContent>
                {purchases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.referenceNo ?? p.purchaseNo ?? p.id} — {p.supplier?.name ?? "Unknown Supplier"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2 — Items table */}
          {selectedPO && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items Received</Label>
                {hasShortfall && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                    ⚠ Shortfall detected
                  </span>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-center p-3 font-medium">Ordered</th>
                      <th className="text-center p-3 font-medium w-28">Received</th>
                      <th className="text-right p-3 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items.map((item) => {
                      const received = receivedQtys[item.productId] ?? item.quantity;
                      const shortfall = item.quantity - received;
                      return (
                        <tr key={item.productId} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{item.product?.product_name ?? "Unknown"}</div>
                            {item.product?.sku && (
                              <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                            )}
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{item.quantity}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={received}
                              onChange={(e) =>
                                setReceivedQtys((prev) => ({
                                  ...prev,
                                  [item.productId]: Math.min(item.quantity, Math.max(0, Number(e.target.value))),
                                }))
                              }
                              className={`h-8 text-center ${shortfall > 0 ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                            />
                            {shortfall > 0 && (
                              <div className="text-xs text-red-500 text-center mt-1">-{shortfall} short</div>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(received * item.unitPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t">
                    <tr>
                      <td className="p-3 font-semibold">Total</td>
                      <td className="p-3 text-center text-muted-foreground">{totalOrdered}</td>
                      <td className="p-3 text-center font-semibold">{totalReceived}</td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(
                          selectedPO.items.reduce(
                            (s, i) => s + (receivedQtys[i.productId] ?? i.quantity) * i.unitPrice, 0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Step 3 — Notes */}
          {selectedPO && (
            <div className="space-y-2">
              <Label>Notes / Remarks</Label>
              <Textarea
                placeholder="e.g. 2 pieces damaged, accepted rest. Delivery in good condition..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedPOId || isExecuting}
              className="flex-1"
            >
              {isExecuting ? "Creating..." : "Create GRN (Save as Draft)"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>

          {selectedPO && (
            <p className="text-xs text-muted-foreground text-center">
              GRN will be saved as <strong>Draft</strong>. A manager must verify it to update stock levels.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}