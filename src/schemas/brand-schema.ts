import { z } from 'zod';

export const brandSchema = z.object({
  name: z.string().min(2),
});

export const updateBrandSchema = brandSchema.extend({
  id: z.string(),
});

export const deleteBrandSchema = z.object({
  id: z.string(),
});

export type BrandInput = z.infer<typeof brandSchema>;
