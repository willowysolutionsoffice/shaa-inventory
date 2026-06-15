import { z } from "zod"
import { salesSchema } from "./sales-schema";
import { salePaymentSchema } from "./sale-payment-schema";
export const salesItemSchema = z
  .object({
    productId:     z.string().min(1, "Product is required"),
    product_name:  z.string().optional(),
    stock:         z.coerce.number().optional(),
    quantity:      z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice:     z.coerce.number().min(0, "Unit price is required"),
    purchasePrice: z.coerce.number().min(0).optional().default(0),
    discount:      z.coerce.number().min(0).default(0),
    subtotal:      z.coerce.number().min(0),
    total:         z.coerce.number().min(0),
  })
  .refine(
    (item) => (item.stock !== undefined ? item.quantity <= item.stock : true),
    { message: "Quantity cannot exceed available stock", path: ["quantity"] }
  );
 
export const fullSalesSchema = salesSchema.extend({
  items:        z.array(salesItemSchema).min(1, "At least one product is required"),
  salesPayment: z.array(salePaymentSchema).min(1),
});
 
export const salesUpdateSchema_full = fullSalesSchema.extend({
  id: z.string().min(1, "Sale ID is required"),
});
 
// Re-export under the name the rest of the codebase expects
export { salesUpdateSchema_full as salesUpdateSchema };
 
export const getSalesByIdSchema = z.object({
  id: z.string().min(1),
});