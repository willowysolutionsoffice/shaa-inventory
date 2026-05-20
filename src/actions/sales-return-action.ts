// src/actions/sales-return-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  fullSalesReturnSchema,
  getSalesReturnByIdSchema,
  updateFullSalesReturnSchema,
} from "@/schemas/sales-return-item-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generateReturnNo = () => `SR-2026-${String(db.salesReturns.length + 1).padStart(3, '0')}`;

export const createSalesReturn = actionClient
  .inputSchema(fullSalesReturnSchema)
  .action(async (values) => {
    try {
      const { salesReturnItem: rawItems, ...returnData } = values.parsedInput;

      const grandTotal = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const returnId = `sret-${Date.now()}`;

      const newReturn = {
        id: returnId,
        returnNo: generateReturnNo(),
        returnDate: returnData.salesReturnDate ? new Date(returnData.salesReturnDate) : new Date(),
        saleId: returnData.saleId || "sale-1",
        customerId: returnData.customerId,
        branchId: returnData.branchId || "main-branch",
        grandTotal,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.salesReturns.push(newReturn);

      rawItems.forEach((item, idx) => {
        db.salesReturnItems.push({
          id: `sritem-${Date.now()}-${idx}`,
          salesReturnId: returnId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal || (item.quantity * item.unitPrice),
          total: item.total || (item.quantity * item.unitPrice),
        });

        // Restock returned product
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
        }
      });

      revalidatePath("/sales-returns");
      return { data: newReturn };
    } catch (error) {
      console.error("Create Sales Return Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getSalesReturnList = actionClient
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
      
      let filtered = [...db.salesReturns];

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
        const items = db.salesReturnItems
          .filter((item) => item.salesReturnId === ret.id)
          .map((item) => ({
            ...item,
            product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
          }));

        return {
          ...ret,
          customer: db.customers.find((c) => c.id === ret.customerId) || { name: "Unknown" },
          salesReturnItem: items,
        };
      });

      const grandTotalSum = filtered.reduce((sum, r) => sum + r.grandTotal, 0);

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
          grandTotal: grandTotalSum,
        },
      };
    } catch (error) {
      console.error("Get Sales Returns Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getSalesReturnById = actionClient
  .inputSchema(getSalesReturnByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    const returnEntry = db.salesReturns.find((r) => r.id === id);
    if (!returnEntry) return { data: null };

    const items = db.salesReturnItems
      .filter((item) => item.salesReturnId === returnEntry.id)
      .map((item) => ({
        ...item,
        product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
      }));

    return {
      data: {
        ...returnEntry,
        customer: db.customers.find((c) => c.id === returnEntry.customerId) || { name: "Unknown" },
        salesReturnItem: items,
      },
    };
  });

export const updateSalesReturn = actionClient
  .inputSchema(updateFullSalesReturnSchema)
  .action(async (values) => {
    const { id, salesReturnItem: rawItems, ...data } = values.parsedInput;

    try {
      const idx = db.salesReturns.findIndex((r) => r.id === id);
      if (idx === -1) return { error: "Sales return not found" };

      const oldReturn = db.salesReturns[idx];

      // Reverse old stock adjustments
      const oldItems = db.salesReturnItems.filter((item) => item.salesReturnId === id);
      oldItems.forEach((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
        }
      });

      // Clear old items
      db.salesReturnItems = db.salesReturnItems.filter((item) => item.salesReturnId !== id);

      const grandTotal = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);

      const updated = {
        ...oldReturn,
        returnDate: data.salesReturnDate ? new Date(data.salesReturnDate) : oldReturn.returnDate,
        customerId: data.customerId || oldReturn.customerId,
        grandTotal,
        updatedAt: new Date(),
      };

      db.salesReturns[idx] = updated;

      // Add new items
      rawItems.forEach((item, index) => {
        db.salesReturnItems.push({
          id: `sritem-${Date.now()}-${index}`,
          salesReturnId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal || (item.quantity * item.unitPrice),
          total: item.total || (item.quantity * item.unitPrice),
        });

        // Restock returned product
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
        }
      });

      revalidatePath("/sales-returns");
      return { data: updated };
    } catch (error) {
      console.error("Update Sales Return Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteSalesReturn = actionClient
  .inputSchema(getSalesReturnByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.salesReturns.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const deleted = db.salesReturns[idx];

        // Reverse stock adjustments
        const oldItems = db.salesReturnItems.filter((item) => item.salesReturnId === id);
        oldItems.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        });

        db.salesReturnItems = db.salesReturnItems.filter((item) => item.salesReturnId !== id);
        db.salesReturns.splice(idx, 1);

        revalidatePath("/sales-returns");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete Sales Return Error:", error);
      return null;
    }
  });
