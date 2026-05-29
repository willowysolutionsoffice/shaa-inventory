// src/actions/variation-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────
// src/actions/variation-actions.ts  —  add this after the import
const getVariations = () => (db as any).variations ?? [];
const getProducts  = () => (db as any).products  ?? [];

const variationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  values: z.array(z.string().min(1)).min(1, "At least one value is required"),
});

const variationUpdateSchema = variationSchema.extend({
  id: z.string().min(1),
});

const variationByIdSchema = z.object({
  id: z.string().min(1),
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export const createVariation = actionClient
  .inputSchema(variationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const variations = getVariations();
      const existing = variations.find(
        (v: Variation) => v.name.toLowerCase() === parsedInput.name.toLowerCase()
      );
      if (existing) return { error: "A variation with this name already exists" };

      const newVariation = {
        id: `var-${Date.now()}`,
        name: parsedInput.name,
        values: parsedInput.values,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      variations.push(newVariation);
      revalidatePath("/variations");
      return { data: newVariation };
    } catch (error) {
      console.error("Create Variation Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getVariationList = actionClient
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      const variations = [...getVariations()].sort(
        (a: Variation, b: Variation) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      return { data: variations };
    } catch (error) {
      console.error("Get Variation List Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getVariationListForForm = actionClient
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      return {
        data: getVariations().map((v: Variation) => ({
          id: v.id,
          name: v.name,
          values: v.values,
        })),
      };
    } catch (error) {
      console.error("Get Variation List For Form Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const updateVariation = actionClient
  .inputSchema(variationUpdateSchema)
  .action(async ({ parsedInput }) => {
    try {
      const variations = getVariations();
      const idx = variations.findIndex((v: Variation) => v.id === parsedInput.id);
      if (idx === -1) return { error: "Variation not found" };

      const nameConflict = variations.find(
        (v: Variation) =>
          v.id !== parsedInput.id &&
          v.name.toLowerCase() === parsedInput.name.toLowerCase()
      );
      if (nameConflict) return { error: "A variation with this name already exists" };

      variations[idx] = {
        ...variations[idx],
        name: parsedInput.name,
        values: parsedInput.values,
        updatedAt: new Date(),
      };

      revalidatePath("/variations");
      return { data: variations[idx] };
    } catch (error) {
      console.error("Update Variation Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteVariation = actionClient
  .inputSchema(variationByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const variations = getVariations();
      const idx = variations.findIndex((v: Variation) => v.id === parsedInput.id);
      if (idx === -1) return { error: "Variation not found" };

      const deleted = variations[idx];
      variations.splice(idx, 1);

      getProducts().forEach((p: any) => {
        p.variationIds = (p.variationIds ?? []).filter((id: string) => id !== parsedInput.id);
      });

      revalidatePath("/variations");
      revalidatePath("/products");
      return { data: deleted };
    } catch (error) {
      console.error("Delete Variation Error:", error);
      return { error: "Something went wrong" };
    }
  });