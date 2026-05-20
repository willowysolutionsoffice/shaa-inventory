// src/actions/purchase-return-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  fullPurchaseReturnSchema,
  getPurchaseReturnByIdSchema,
  updateFullPurchaseReturnSchema,
} from "@/schemas/purchase-return-item-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generateReturnNo = () => `PR-2026-${String(db.purchaseReturns.length + 1).padStart(3, '0')}`;

export const createPurchaseReturn = actionClient
  .inputSchema(fullPurchaseReturnSchema)
  .action(async (values) => {
    try {
      const { purchaseReturnItem: rawItems, ...returnData } = values.parsedInput;

      const totalAmount = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const returnId = `pret-${Date.now()}`;

      const newReturn = {
        id: returnId,
        returnNo: generateReturnNo(),
        returnDate: returnData.returnDate ? new Date(returnData.returnDate) : new Date(),
        purchaseId: returnData.purchaseId || "pur-1",
        supplierId: returnData.supplierId,
        branchId: returnData.branchId || "main-branch",
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.purchaseReturns.push(newReturn);

      rawItems.forEach((item, idx) => {
        db.purchaseReturnItems.push({
          id: `pritem-${Date.now()}-${idx}`,
          purchaseReturnId: returnId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total || (item.quantity * item.unitPrice),
        });

        // Decrement stock for returned products
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
        }
      });

      revalidatePath("/purchase-returns");
      return { data: newReturn };
    } catch (error) {
      console.error("Create Purchase Return Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getPurchaseReturnList = actionClient
  .inputSchema(
    z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      from: z.string().optional(),
      to: z.string().optional(),
    })
  )
  .action(async (values) => {
    try {
      const { page, limit, from, to } = values.parsedInput;
      
      let filtered = [...db.purchaseReturns];

      if (from || to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        filtered = filtered.filter((ret) => {
          const d = new Date(ret.returnDate);
          if (fromDate && d < fromDate) return false;
          if (toDate && d > toDate) return false;
          return true;
        });
      }

      filtered.sort((a, b) => b.returnDate.getTime() - a.returnDate.getTime());

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginated = filtered.slice(skip, skip + limit);

      const returns = paginated.map((ret) => {
        const items = db.purchaseReturnItems
          .filter((item) => item.purchaseReturnId === ret.id)
          .map((item) => ({
            ...item,
            product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
          }));

        return {
          ...ret,
          supplier: db.suppliers.find((s) => s.id === ret.supplierId) || { name: "Unknown" },
          purchaseReturnItem: items,
        };
      });

      const totalAmountSum = filtered.reduce((sum, r) => sum + r.totalAmount, 0);

      return {
        returns,
        metadata: {
          totalPages,
          totalCount,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        totals: {
          totalAmount: totalAmountSum,
        },
      };
    } catch (error) {
      console.error("Get Purchase Returns Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getPurchaseReturnById = actionClient
  .inputSchema(getPurchaseReturnByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    const returnEntry = db.purchaseReturns.find((r) => r.id === id);
    if (!returnEntry) return { data: null };

    const items = db.purchaseReturnItems
      .filter((item) => item.purchaseReturnId === returnEntry.id)
      .map((item) => ({
        ...item,
        product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
      }));

    return {
      data: {
        ...returnEntry,
        supplier: db.suppliers.find((s) => s.id === returnEntry.supplierId) || { name: "Unknown" },
        purchaseReturnItem: items,
      },
    };
  });

export const updatePurchaseReturn = actionClient
  .inputSchema(updateFullPurchaseReturnSchema)
  .action(async (values) => {
    const { id, purchaseReturnItem: rawItems, ...data } = values.parsedInput;

    try {
      const idx = db.purchaseReturns.findIndex((r) => r.id === id);
      if (idx === -1) return { error: "Purchase return not found" };

      const oldReturn = db.purchaseReturns[idx];

      // Revert old stock adjustments (add back returned stock)
      const oldItems = db.purchaseReturnItems.filter((item) => item.purchaseReturnId === id);
      oldItems.forEach((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
        }
      });

      // Clear old items
      db.purchaseReturnItems = db.purchaseReturnItems.filter((item) => item.purchaseReturnId !== id);

      const totalAmount = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);

      const updated = {
        ...oldReturn,
        returnDate: data.returnDate ? new Date(data.returnDate) : oldReturn.returnDate,
        supplierId: data.supplierId || oldReturn.supplierId,
        totalAmount,
        updatedAt: new Date(),
      };

      db.purchaseReturns[idx] = updated;

      // Add new items
      rawItems.forEach((item, index) => {
        db.purchaseReturnItems.push({
          id: `pritem-${Date.now()}-${index}`,
          purchaseReturnId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total || (item.quantity * item.unitPrice),
        });

        // Decrement stock for new items
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
        }
      });

      revalidatePath("/purchase-returns");
      return { data: updated };
    } catch (error) {
      console.error("Update Purchase Return Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const deletePurchaseReturn = actionClient
  .inputSchema(getPurchaseReturnByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.purchaseReturns.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const deleted = db.purchaseReturns[idx];

        // Revert stock adjustments (add back returned stock)
        const oldItems = db.purchaseReturnItems.filter((item) => item.purchaseReturnId === id);
        oldItems.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock += item.quantity;
          }
        });

        db.purchaseReturnItems = db.purchaseReturnItems.filter((item) => item.purchaseReturnId !== id);
        db.purchaseReturns.splice(idx, 1);

        revalidatePath("/purchase-returns");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete Purchase Return Error:", error);
      return null;
    }
  });
