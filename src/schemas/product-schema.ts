import { z } from 'zod';

export const productSchema = z.object({
  product_name:  z.string().min(1, 'Product name is required'),
  sku:           z.string().min(1, 'SKU is required'),
  unit:          z.string().min(1, 'Unit is required'),
  stock:         z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice:  z.coerce.number().min(0, 'Selling price cannot be negative'),
  brandId:       z.string().min(1, 'Brand is required'),
  subBrandId:    z.string().optional(),
  categoryId:    z.string().optional(),
  branchId:      z.string().min(1, 'Branch is required'),
  description:   z.string().optional(),
  hsl:           z.string().optional(),
});