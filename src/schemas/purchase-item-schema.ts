import { z } from "zod"
import { purchaseSchema } from "./purchase-schema";
import { purchasePaymentSchema } from "./purchase-payment-schema";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  product_name: z.string().optional(),
  stock: z.coerce.number().optional(),
  quantity: z.coerce.number().min(1, "Quantity is required"),
  unitPrice: z.coerce.number().min(0, "Unit Price is required"),
  discount: z.coerce.number().min(0, "Discount is required"),
  subtotal: z.coerce.number().min(0, "Subtotal is required"),
  total: z.coerce.number().min(0, "Total is required"),
});

export const fullPurchaseSchema = purchaseSchema.extend({
  items: z.array(purchaseItemSchema).min(1, "At least one product is required"),
  payments: z.array(purchasePaymentSchema)
});

export const purchaseUpdateSchema = fullPurchaseSchema.extend({
  id: z.string().min(1, "Purchase ID is required"),
});

export const getPurchaseByIdSchema = z.object({
  id: z.string().min(1),
});

