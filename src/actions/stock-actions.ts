// src/actions/stock-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const stockUpdateSchema = z.object({
  id: z.string(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

export const updateProductStock = actionClient
  .inputSchema(stockUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, stock } = parsedInput;

    try {
      const product = db.products.find((p) => p.id === id);
      if (product) {
        product.stock = stock;
        product.updatedAt = new Date();

        revalidatePath("/admin/stock-adjustment");
        revalidatePath("/products");

        return { data: product };
      }
      return { error: "Product not found" };
    } catch (error) {
      console.error("Stock Update Error:", error);
      return { error: "Failed to update stock" };
    }
  });
