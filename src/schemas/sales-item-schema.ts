import { z } from "zod"
import { salesSchema } from "./sales-schema";
import { salePaymentSchema } from "./sale-payment-schema";

export const salesItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  product_name: z.string().optional(),
  stock: z.coerce.number().optional(),
  quantity: z.coerce.number().min(1, "Quantity is required"),
  unitPrice: z.coerce.number().min(0, "Unit Price is required"),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0, "Discount is required"),
  subtotal: z.coerce.number().min(0, "Subtotal is required"),
  total: z.coerce.number().min(0, "Total is required"),

}).refine(
  (item) => {
    if (item.stock !== undefined) {
      return item.quantity <= item.stock
    }
    return true
  }, {
  message: "Quantity cannot exceed available stock",
  path: ["quantity"]
})

export const fullSalesSchema = salesSchema.extend({
  items: z.array(salesItemSchema).min(1, "At least one product is required"),
  salesPayment: z.array(salePaymentSchema)
});

export const salesUpdateSchema = fullSalesSchema.extend({
  id: z.string().min(1, "Purchase ID is required"),
});

export const getSalesByIdSchema = z.object({
  id: z.string().min(1),
});

