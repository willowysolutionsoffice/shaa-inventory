// src/actions/brand-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { brandSchema, deleteBrandSchema, updateBrandSchema } from "@/schemas/brand-schema";
import { revalidatePath } from "next/cache";

export const createBrand = actionClient
  .inputSchema(brandSchema)
  .action(async (values) => {
    try {
      const newBrand = {
        id: `brand-${Date.now()}`,
        ...values.parsedInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.brands.push(newBrand);
      revalidatePath("/brands");
      return { data: newBrand };
    } catch (error) {
      console.error("Created Brand Error :", error);
      return { error: "Something went wrong" };
    }
  });

export const getBrandList = actionClient.action(async () => {
  try {
    revalidatePath("/brands");
    return { data: db.brands };
  } catch (error) {
    console.error("Get Brand Error :", error);
    return { error: "Something went wrong" };
  }
});

export const getBrandlistForDropdown = async () => {
  return db.brands.map(b => ({ id: b.id, name: b.name }));
};

export const updateBrand = actionClient
  .inputSchema(updateBrandSchema)
  .action(async (values) => {
    const { id, ...data } = values.parsedInput;
    try {
      const brand = db.brands.find(b => b.id === id);
      if (brand) {
        Object.assign(brand, data);
        brand.updatedAt = new Date();
        revalidatePath("/brands");
        return { data: brand };
      }
      return { error: "Brand not found" };
    } catch (error) {
      console.error("Error on Brand Updating :", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteBrand = actionClient
  .inputSchema(deleteBrandSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.brands.findIndex(b => b.id === id);
      if (idx !== -1) {
        const deleted = db.brands[idx];
        db.brands.splice(idx, 1);
        revalidatePath("/brands");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete Brand Error:", error);
      return null;
    }
  });
