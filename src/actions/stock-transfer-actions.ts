// src/actions/stock-transfer-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StockTransfer {
  id: string;
  transferNo: string;
  transferDate: Date;
  fromBranchId: string;
  toBranchId: string;
  status: "Pending" | "Completed" | "Cancelled";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
}

// ── In-memory store extension ─────────────────────────────────────────────────

const globalStore = globalThis as unknown as {
  stockTransfers: StockTransfer[];
  stockTransferItems: StockTransferItem[];
  transferCounter: number;
};

if (!globalStore.stockTransfers) globalStore.stockTransfers = [];
if (!globalStore.stockTransferItems) globalStore.stockTransferItems = [];
if (!globalStore.transferCounter) globalStore.transferCounter = 1;

// ── Schemas ───────────────────────────────────────────────────────────────────

const transferItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const createTransferSchema = z.object({
  fromBranchId: z.string().min(1, "Source branch is required"),
  toBranchId: z.string().min(1, "Destination branch is required"),
  note: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "At least one item is required"),
});

// ── Actions ───────────────────────────────────────────────────────────────────

export const createStockTransfer = actionClient
  .inputSchema(createTransferSchema)
  .action(async ({ parsedInput }) => {
    const { fromBranchId, toBranchId, note, items } = parsedInput;

    if (fromBranchId === toBranchId) {
      return { error: "Source and destination branches cannot be the same" };
    }

    // Validate stock availability
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) return { error: `Product not found: ${item.productId}` };
      if (product.stock < item.quantity) {
        return {
          error: `Insufficient stock for "${product.product_name}". Available: ${product.stock}`,
        };
      }
    }

    const transferNo = `TRF-${new Date().getFullYear()}-${String(globalStore.transferCounter).padStart(4, "0")}`;
    globalStore.transferCounter += 1;

    const transfer: StockTransfer = {
      id: `transfer-${Date.now()}`,
      transferNo,
      transferDate: new Date(),
      fromBranchId,
      toBranchId,
      status: "Completed",
      note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const transferItems: StockTransferItem[] = items.map((item, idx) => ({
      id: `titem-${Date.now()}-${idx}`,
      transferId: transfer.id,
      productId: item.productId,
      quantity: item.quantity,
    }));

    // Deduct from source branch product & add to destination
    for (const item of items) {
      const srcProduct = db.products.find((p) => p.id === item.productId && p.branchId === fromBranchId);
      if (srcProduct) {
        srcProduct.stock -= item.quantity;
        srcProduct.updatedAt = new Date();
      }

      // Check if product exists at destination branch, else we just note it
      const destProduct = db.products.find((p) => p.id === item.productId && p.branchId === toBranchId);
      if (destProduct) {
        destProduct.stock += item.quantity;
        destProduct.updatedAt = new Date();
      }
      // In a real system you'd create the product at destination if it doesn't exist
    }

    globalStore.stockTransfers.push(transfer);
    globalStore.stockTransferItems.push(...transferItems);

    revalidatePath("/admin/stock-adjustment");
    revalidatePath("/admin/stock-transfer");

    return { data: transfer };
  });

export const getStockTransfers = actionClient.action(async () => {
  try {
    const transfers = [...globalStore.stockTransfers].sort(
      (a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()
    );

    const enriched = transfers.map((t) => {
      const fromBranch = db.branches.find((b) => b.id === t.fromBranchId);
      const toBranch = db.branches.find((b) => b.id === t.toBranchId);
      const items = globalStore.stockTransferItems.filter((i) => i.transferId === t.id);
      const enrichedItems = items.map((i) => {
        const product = db.products.find((p) => p.id === i.productId);
        return { ...i, product_name: product?.product_name ?? "Unknown", sku: product?.sku ?? "" };
      });

      return {
        ...t,
        fromBranchName: fromBranch?.name ?? "Unknown",
        toBranchName: toBranch?.name ?? "Unknown",
        items: enrichedItems,
        itemCount: items.length,
      };
    });

    return { data: enriched };
  } catch (error) {
    return { error: "Failed to fetch transfers" };
  }
});