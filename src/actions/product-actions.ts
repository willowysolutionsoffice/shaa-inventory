// src/actions/product-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { getProductByList, productSchema, productUpdateSchema } from "@/schemas/product-schema";
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const createProduct = actionClient
  .inputSchema(productSchema)
  .action(async (values) => {
    try {
      const data = values.parsedInput;
      
      const purchasePrice = data.purchasePrice ? Math.round(data.purchasePrice) : 0;
      const sellingPrice = data.sellingPrice ? Math.round(data.sellingPrice) : 0;

      const newProduct = {
        id: `prod-${Date.now()}`,
        product_name: data.product_name,
        sku: data.sku,
        brandId: data.brandId,
        branchId: data.branchId || "main-branch",
        stock: data.stock || 0,
        purchasePrice,
        sellingPrice,
        description: data.description || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.products.push(newProduct);
      revalidatePath("/products");
      return { data: newProduct };
    } catch (error) {
      console.error("Product Creation Error :", error);
      return { error: "Something went wrong" };
    }
  });

export const getProductList = actionClient
  .inputSchema(
    z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    })
  )
  .action(async (values) => {
    try {
      const { page, limit } = values.parsedInput;
      
      const products = db.products.map((p) => ({
        ...p,
        brand: db.brands.find((b) => b.id === p.brandId) || { name: "Unknown" },
      }));

      const totalCount = products.length;
      const totalPages = Math.ceil(totalCount / limit);
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

      // Sort by createdAt desc
      products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        products,
        metadata: {
          totalPages,
          totalCount,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        totals: {
          stock: totalStock,
        },
      };
    } catch (error) {
      console.error("Get Product List error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getProductListForDropdown = actionClient.inputSchema(
  z.object({ query: z.string().optional() })
).action(async ({ parsedInput }) => {
  const query = parsedInput.query?.trim().toLowerCase() || "";
  
  let products = [...db.products];
  if (query) {
    products = products.filter((p) => p.product_name.toLowerCase().includes(query));
  }

  return {
    products: products.map((p) => ({
      id: p.id,
      product_name: p.product_name,
      stock: p.stock,
      quantity: 1,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
    })),
  };
});

export const getProductById = actionClient
  .inputSchema(getProductByList)
  .action(async (values) => {
    const { id } = values.parsedInput;
    const product = db.products.find((p) => p.id === id);
    if (product) {
      return {
        data: {
          ...product,
          brand: db.brands.find((b) => b.id === product.brandId) || { name: "Unknown" },
          branch: db.branches.find((b) => b.id === product.branchId) || { name: "Unknown" },
        },
      };
    }
    return { data: null };
  });

export const updateProduct = actionClient
  .inputSchema(productUpdateSchema)
  .action(async (values) => {
    const { id, ...inputData } = values.parsedInput;
    try {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const purchasePrice = inputData.purchasePrice ? Math.round(inputData.purchasePrice) : db.products[idx].purchasePrice;
        const sellingPrice = inputData.sellingPrice ? Math.round(inputData.sellingPrice) : db.products[idx].sellingPrice;

        const updated = {
          ...db.products[idx],
          ...inputData,
          purchasePrice,
          sellingPrice,
          updatedAt: new Date(),
        };

        db.products[idx] = updated;
        revalidatePath("/products");
        return { data: updated };
      }
      return { error: "Product not found" };
    } catch (error) {
      console.error("Updating Product Error :", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteProduct = actionClient
  .inputSchema(getProductByList)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const deleted = db.products[idx];
        db.products.splice(idx, 1);
        revalidatePath("/products");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete product error:", error);
      return null;
    }
  });
