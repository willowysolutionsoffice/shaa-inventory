import { z } from "zod"

export const productSchema = z.object({
  product_name: z.string().min(2, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  branchId: z.string().min(1, "Branch is required"),
  unit: z.string().min(1, "Unit is required"),
  stock: z.coerce.number().min(0, { message: "Stock cannot be negative" }),
  brandId: z.string().min(1, "Brand must be selected"),
  purchasePrice: z.coerce.number().min(0, "Purchase Price is required"),
  sellingPrice: z.coerce.number().optional(),
})

export const productUpdateSchema = productSchema.extend({
  id: z.string(),
})

export const getProductByList = z.object({
  id: z.string(),
})

export type ProductInput = z.infer<typeof productSchema>
