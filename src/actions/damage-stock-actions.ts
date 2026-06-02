// src/actions/damage-stock-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DamageReason =
  | "Physical Damage"
  | "Water Damage"
  | "Expiry"
  | "Theft"
  | "Quality Issue"
  | "Other";

export interface DamageRecord {
  id: string;
  damageNo: string;
  damageDate: Date;
  branchId: string;
  productId: string;
  quantity: number;
  reason: DamageReason;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── In-memory store extension ─────────────────────────────────────────────────

const globalStore = globalThis as unknown as {
  damageRecords: DamageRecord[];
  damageCounter: number;
};

if (!globalStore.damageRecords) globalStore.damageRecords = [];
if (!globalStore.damageCounter) globalStore.damageCounter = 1;

// ── Schemas ───────────────────────────────────────────────────────────────────

const damageReasons = [
  "Physical Damage",
  "Water Damage",
  "Expiry",
  "Theft",
  "Quality Issue",
  "Other",
] as const;

const createDamageSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.enum(damageReasons),
  note: z.string().optional(),
});

// ── Actions ───────────────────────────────────────────────────────────────────

export const createDamageRecord = actionClient
  .inputSchema(createDamageSchema)
  .action(async ({ parsedInput }) => {
    const { branchId, productId, quantity, reason, note } = parsedInput;

    const product = db.products.find((p) => p.id === productId);
    if (!product) return { error: "Product not found" };

    if (product.stock < quantity) {
      return {
        error: `Insufficient stock. Available: ${product.stock} ${product.unit}`,
      };
    }

    const damageNo = `DMG-${new Date().getFullYear()}-${String(globalStore.damageCounter).padStart(4, "0")}`;
    globalStore.damageCounter += 1;

    const record: DamageRecord = {
      id: `damage-${Date.now()}`,
      damageNo,
      damageDate: new Date(),
      branchId,
      productId,
      quantity,
      reason,
      note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Deduct from stock
    product.stock -= quantity;
    product.updatedAt = new Date();

    globalStore.damageRecords.push(record);

    revalidatePath("/admin/stock-adjustment");
    revalidatePath("/admin/damage-stock");

    return { data: record };
  });

export const getDamageRecords = actionClient.action(async () => {
  try {
    const records = [...globalStore.damageRecords].sort(
      (a, b) => new Date(b.damageDate).getTime() - new Date(a.damageDate).getTime()
    );

    const enriched = records.map((r) => {
      const product = db.products.find((p) => p.id === r.productId);
      const branch = db.branches.find((b) => b.id === r.branchId);
      return {
        ...r,
        product_name: product?.product_name ?? "Unknown",
        sku: product?.sku ?? "",
        branchName: branch?.name ?? "Unknown",
        stockValue: (product?.purchasePrice ?? 0) * r.quantity,
      };
    });

    return { data: enriched };
  } catch (error) {
    return { error: "Failed to fetch damage records" };
  }
});