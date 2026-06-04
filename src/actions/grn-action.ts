'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const getGRNList = actionClient.action(async () => {
  try {
    const grns = db.grns.map((grn) => ({
      ...grn,
      supplier: db.suppliers.find((s) => s.id === grn.supplierId) ?? null,
      branch: db.branches.find((b) => b.id === grn.branchId) ?? null,
      purchase: db.purchases.find((p) => p.id === grn.purchaseId) ?? null,
      items: db.grnItems
        .filter((i) => i.grnId === grn.id)
        .map((i) => ({
          ...i,
          product: db.products.find((p) => p.id === i.productId) ?? null,
        })),
    })).sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());

    return { grns };
  } catch (error) {
    console.error("Get GRN List Error:", error);
    return { error: "Something went wrong" };
  }
});

export const getGRNById = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async (values) => {
    try {
      const { id } = values.parsedInput;
      const grn = db.grns.find((g) => g.id === id);
      if (!grn) return { error: "GRN not found" };

      return {
        grn: {
          ...grn,
          supplier: db.suppliers.find((s) => s.id === grn.supplierId) ?? null,
          branch: db.branches.find((b) => b.id === grn.branchId) ?? null,
          purchase: db.purchases.find((p) => p.id === grn.purchaseId) ?? null,
          items: db.grnItems
            .filter((i) => i.grnId === grn.id)
            .map((i) => ({
              ...i,
              product: db.products.find((p) => p.id === i.productId) ?? null,
            })),
        },
      };
    } catch (error) {
      console.error("Get GRN By ID Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const updateGRNStatus = actionClient
  .inputSchema(z.object({ id: z.string(), status: z.enum(["Draft", "Verified", "Rejected"]) }))
  .action(async (values) => {
    try {
      const { id, status } = values.parsedInput;
      const idx = db.grns.findIndex((g) => g.id === id);
      if (idx === -1) return { error: "GRN not found" };

      const wasAlreadyVerified = db.grns[idx].status === "Verified";

      db.grns[idx] = { ...db.grns[idx], status, updatedAt: new Date() };

      // Auto-update stock only when transitioning TO Verified
      if (status === "Verified" && !wasAlreadyVerified) {
        const grnItems = db.grnItems.filter((i) => i.grnId === id);
        grnItems.forEach((item) => {
          const prodIdx = db.products.findIndex((p) => p.id === item.productId);
          if (prodIdx !== -1) {
            db.products[prodIdx].stock += item.receivedQty;
          }
        });
      }

      revalidatePath("/admin/grn");
      return { data: db.grns[idx] };
    } catch (error) {
      console.error("Update GRN Status Error:", error);
      return { error: "Something went wrong" };
    }
  });
  export const createGRN = actionClient
  .inputSchema(z.object({
    purchaseId: z.string().min(1),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      orderedQty: z.number(),
      receivedQty: z.number().min(0),
      unitPrice: z.number(),
    })),
  }))
  .action(async (values) => {
    try {
      const { purchaseId, notes, items } = values.parsedInput;

      const purchase = db.purchases.find((p) => p.id === purchaseId);
      if (!purchase) return { error: "Purchase not found" };

      // Check no GRN already exists for this PO
      const existing = db.grns.find((g) => g.purchaseId === purchaseId);
      if (existing) return { error: "A GRN already exists for this purchase order" };

      const grnNo = `GRN-${new Date().getFullYear()}-${String(db.grns.length + 1).padStart(3, "0")}`;

      const newGRN = {
        id: `grn-${Date.now()}`,
        grnNo,
        purchaseId,
        supplierId: purchase.supplierId,
        branchId: purchase.branchId,
        receivedDate: new Date(),
        status: "Draft" as const,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newItems = items.map((item, i) => ({
        id: `gitem-${Date.now()}-${i}`,
        grnId: newGRN.id,
        productId: item.productId,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        unitPrice: item.unitPrice,
        total: item.receivedQty * item.unitPrice,
      }));

      db.grns.push(newGRN);
      db.grnItems.push(...newItems);
      revalidatePath("/admin/grn");
      return { data: newGRN };
    } catch (error) {
      console.error("Create GRN Error:", error);
      return { error: "Something went wrong" };
    }
  });