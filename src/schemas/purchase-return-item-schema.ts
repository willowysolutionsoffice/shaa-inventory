import { z } from "zod";
import { purchaseReturnSchema } from "./purchase-return-schema";

export const purchaseReturnItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  product_name: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity is required"),
  unitPrice: z.coerce.number().min(0, "Unit Price is required"),
  subtotal: z.coerce.number().min(0, "Subtotal is required"),
  total: z.coerce.number().min(0, "Total is required"),
});

export const fullPurchaseReturnSchema = purchaseReturnSchema.extend({
  purchaseReturnItem: z.array(purchaseReturnItemSchema).min(1, "At least one returned item is required"),
});

export const updateFullPurchaseReturnSchema = fullPurchaseReturnSchema.extend({
  id: z.string().min(1, "Return ID is required"),
});

export const getPurchaseReturnByIdSchema = z.object({
  id: z.string().min(1),
});