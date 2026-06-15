'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

const variationSchema = z.object({
  name:   z.string().min(1, 'Name is required'),
  values: z.array(z.string().min(1)).min(1, 'At least one value is required'),
});

const variationUpdateSchema = variationSchema.partial().extend({
  id: z.string().min(1),
});

const variationByIdSchema = z.object({
  id: z.string().min(1),
});

export type VariationValue = {
  id:    string;
  value: string;
};

export type Variation = {
  id:        string;
  name:      string;
  values:    VariationValue[];
  createdAt: string;
  updatedAt: string;
};

export const createVariation = actionClient
  .inputSchema(variationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const variation = await api.post<Variation>('/variations', parsedInput);
      revalidatePath('/admin/variations');
      return { data: variation };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// Used by variations page — returns full { id, value } objects
export const getVariationList = actionClient
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      const variations = await api.get<Variation[]>('/variations');
      return {
        data: (variations ?? []).map((v) => ({
          id:        v.id,
          name:      v.name,
          values:    v.values ?? [],   // keep as { id, value }[]
          createdAt: new Date(v.createdAt),
          updatedAt: new Date(v.updatedAt),
        })),
      };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

// Used by product form — also returns full { id, value } objects
export const getVariationListForForm = actionClient
  .inputSchema(z.object({ branchId: z.string().optional() }))
  .action(async () => {
    try {
      const variations = await api.get<Variation[]>('/variations');
      return {
        data: {
          data: (variations ?? []).map((v) => ({
            id:     v.id,
            name:   v.name,
            values: v.values ?? [],  // keep as { id, value }[]
          })),
        },
      };
    } catch {
      return { data: { data: [] } };
    }
  });

export const updateVariation = actionClient
  .inputSchema(variationUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      const variation = await api.patch<Variation>(`/variations/${id}`, data);
      revalidatePath('/admin/variations');
      return { data: variation };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteVariation = actionClient
  .inputSchema(variationByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const variation = await api.delete<Variation>(`/variations/${parsedInput.id}`);
      revalidatePath('/admin/variations');
      return { data: variation };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });