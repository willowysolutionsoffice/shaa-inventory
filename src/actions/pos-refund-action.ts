// src/actions/pos-refund-action.ts
"use server";

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const posRefundSchema = z.object({
  saleId: z.string().min(1),
  // Accept either a customer ID or a name — we resolve below
  customerId: z.string().min(1),
  // Accept either a branch ID or a name — we resolve below
  branchId: z.string().min(1),
  refundMethod: z.enum(["original", "cash", "credit"]),
  reason: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string(),
      qty:       z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ).min(1),
});

export const posRefund = actionClient
  .inputSchema(posRefundSchema)
  .action(async (values) => {
    try {
      const { saleId, customerId, branchId, items } = values.parsedInput;

      // Resolve customerId — could be an ID or a display name
      const customer =
        db.customers.find((c) => c.id === customerId) ??
        db.customers.find((c) =>
          c.name.toLowerCase() === customerId.toLowerCase()
        ) ??
        db.customers[0]; // fallback to first customer

      // Resolve branchId — could be an ID or a branch name
      const branch =
        db.branches.find((b) => b.id === branchId) ??
        db.branches.find((b) =>
          b.name.toLowerCase().includes(branchId.toLowerCase())
        ) ??
        db.branches[0]; // fallback to first branch

      const grandTotal = items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0
      );

      const returnId  = `sret-${Date.now()}`;
      const returnNo  = `SR-2026-${String(db.salesReturns.length + 1).padStart(3, "0")}`;

      const newReturn = {
        id:         returnId,
        returnNo,
        returnDate: new Date(),
        saleId,
        customerId: customer.id,
        branchId:   branch.id,
        grandTotal,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      };

      db.salesReturns.push(newReturn);

      // Add return items and restock
      items.forEach((item, idx) => {
        db.salesReturnItems.push({
          id:             `sritem-${Date.now()}-${idx}`,
          salesReturnId:  returnId,
          productId:      item.productId,
          quantity:       item.qty,
          unitPrice:      item.unitPrice,
          subtotal:       item.qty * item.unitPrice,
          total:          item.qty * item.unitPrice,
        });

        // Restock
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.qty;
        }
      });

      // Update customer salesReturnDue
      if (customer) {
        customer.salesReturnDue =
          (customer.salesReturnDue ?? 0) + grandTotal;
      }

      revalidatePath("/sales-return");
      revalidatePath("/sales");

      return { returnNo, grandTotal };
    } catch (error) {
      console.error("POS Refund Error:", error);
      return { error: "Refund failed. Please try again." };
    }
  });