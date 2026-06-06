// src/actions/purchase-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  fullPurchaseSchema,
  getPurchaseByIdSchema,
  purchaseUpdateSchema,
} from "@/schemas/purchase-item-schema";
import { purchaseStatusEnum } from "@/schemas/purchase-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generatePurchaseNo = () => `PO-2026-${String(db.purchases.length + 1).padStart(3, '0')}`;

export const createPurchase = actionClient
  .inputSchema(fullPurchaseSchema)
  .action(async (values) => {
    try {
      const {
        items: rawItems,
        payments: rawPayments,
        status,
        ...purchaseData
      } = values.parsedInput;

      const totalAmount = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const paidAmount = rawPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount = totalAmount - paidAmount;
      const purchaseId = `pur-${Date.now()}`;

      const newPurchase = {
        id: purchaseId,
        purchaseNo: generatePurchaseNo(),
        purchaseDate: purchaseData.purchaseDate ? new Date(purchaseData.purchaseDate) : new Date(),
        supplierId: purchaseData.supplierId,
        branchId: purchaseData.branchId || "main-branch",
        totalAmount,
        paymentStatus: dueAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
        paymentDue: dueAmount,
        status: status || "Ordered",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.purchases.push(newPurchase);

      // Add payments
      rawPayments.forEach((p, idx) => {
        if ((p.amount || 0) > 0) {
          db.purchasePayments.push({
            id: `ppay-${Date.now()}-${idx}`,
            purchaseId,
            amount: p.amount,
            paidOn: p.paidOn ? new Date(p.paidOn) : new Date(),
            paymentMethod: p.paymentMethod,
            paymentNote: p.paymentNote || null,
            dueDate: p.dueDate ? new Date(p.dueDate) : null,
          });
        }
      });

      // Add items
      rawItems.forEach((item, idx) => {
        db.purchaseItems.push({
          id: `pitem-${Date.now()}-${idx}`,
          purchaseId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total || (item.quantity * item.unitPrice),
        });

        // If status is "Received", increment stock and update purchase price
        if (status === "Received") {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.purchasePrice = Math.round(item.unitPrice);
            product.stock += item.quantity;
          }
        }
      });

      // Update supplier purchaseDue
      if (status === "Received") {
        const supplier = db.suppliers.find((s) => s.id === purchaseData.supplierId);
        if (supplier) {
          supplier.purchaseDue = (supplier.purchaseDue || 0) + dueAmount;
        }
      }

      revalidatePath("/purchases");
      return { data: newPurchase };
    } catch (error) {
      console.error("Create Purchase Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getPurchaseList = actionClient
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
      
      let filtered = [...db.purchases];

      if (from || to) {
       const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;

        filtered = filtered.filter((pur) => {
          const d = new Date(pur.purchaseDate);
          if (fromDate && d < fromDate) return false;
          if (toDate && d > toDate) return false;
          return true;
        });
      }

      filtered.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginated = filtered.slice(skip, skip + limit);

      const purchases = paginated.map((pur) => {
        const pItems = db.purchaseItems
          .filter((item) => item.purchaseId === pur.id)
          .map((item) => ({
            ...item,
            product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
          }));

        const payments = db.purchasePayments.filter((p) => p.purchaseId === pur.id);

        return {
          ...pur,
          supplier: db.suppliers.find((s) => s.id === pur.supplierId) || { name: "Unknown" },
          items: pItems,
          payments,
          branch: db.branches.find((b) => b.id === pur.branchId) || { name: "Unknown" },
        };
      });

      const totalAmountSum = filtered.reduce((sum, p) => sum + p.totalAmount, 0);
      const dueAmountSum = filtered.reduce((sum, p) => sum + p.paymentDue, 0);
      const paidAmountSum = totalAmountSum - dueAmountSum;

      return {
        purchases,
        metadata: {
          totalPages,
          totalCount,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        totals: {
          totalAmount: totalAmountSum,
          dueAmount: dueAmountSum,
          paidAmount: paidAmountSum,
        },
      };
    } catch (error) {
      console.error("Get Purchase List Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getPurchaseById = actionClient
  .inputSchema(getPurchaseByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    const purchase = db.purchases.find((p) => p.id === id);
    if (!purchase) return { data: null };

    const items = db.purchaseItems
      .filter((item) => item.purchaseId === purchase.id)
      .map((item) => ({
        ...item,
        product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
      }));

    const payments = db.purchasePayments.filter((p) => p.purchaseId === purchase.id);

    return {
      data: {
        ...purchase,
        supplier: db.suppliers.find((s) => s.id === purchase.supplierId) || { name: "Unknown" },
        branch: db.branches.find((b) => b.id === purchase.branchId) || { name: "Unknown" },
        items,
        payments,
      },
    };
  });

export const updatePurchase = actionClient
  .inputSchema(purchaseUpdateSchema)
  .action(async (values) => {
    const {
      id,
      items: rawItems,
      payments: rawPayments,
      status,
      ...data
    } = values.parsedInput;

    try {
      const idx = db.purchases.findIndex((p) => p.id === id);
      if (idx === -1) return { error: "Purchase not found" };

      const oldPurchase = db.purchases[idx];
      const oldDue = oldPurchase.paymentDue;

      // Reverse stock if previously Received
      if (oldPurchase.status === "Received") {
        const oldItems = db.purchaseItems.filter((item) => item.purchaseId === id);
        oldItems.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        });
      }

      // Clear old items and payments
      db.purchaseItems = db.purchaseItems.filter((item) => item.purchaseId !== id);
      db.purchasePayments = db.purchasePayments.filter((p) => p.purchaseId !== id);

      const totalAmount = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const paidAmount = rawPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount = totalAmount - paidAmount;

      const updatedPurchase = {
        ...oldPurchase,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : oldPurchase.purchaseDate,
        supplierId: data.supplierId || oldPurchase.supplierId,
        branchId: data.branchId || oldPurchase.branchId,
        status: status || oldPurchase.status,
        totalAmount,
        paymentStatus: dueAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
        paymentDue: dueAmount,
        updatedAt: new Date(),
      };

      db.purchases[idx] = updatedPurchase;

      // Add items
      rawItems.forEach((item, index) => {
        db.purchaseItems.push({
          id: `pitem-${Date.now()}-${index}`,
          purchaseId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total || (item.quantity * item.unitPrice),
        });

        // Increment stock if Received
        if (status === "Received") {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.purchasePrice = Math.round(item.unitPrice);
            product.stock += item.quantity;
          }
        }
      });

      // Add payments
      rawPayments.forEach((p, index) => {
        if ((p.amount || 0) > 0) {
          db.purchasePayments.push({
            id: `ppay-${Date.now()}-${index}`,
            purchaseId: id,
            amount: p.amount,
            paidOn: p.paidOn ? new Date(p.paidOn) : new Date(),
            paymentMethod: p.paymentMethod,
            paymentNote: p.paymentNote || null,
            dueDate: p.dueDate ? new Date(p.dueDate) : null,
          });
        }
      });

      // Update supplier purchaseDue
      if (status === "Received") {
        const supplier = db.suppliers.find((s) => s.id === updatedPurchase.supplierId);
        if (supplier) {
          supplier.purchaseDue = (supplier.purchaseDue || 0) - oldDue + dueAmount;
        }
      }

      revalidatePath("/purchases");
      return { data: updatedPurchase };
    } catch (error) {
      console.error("Update Purchase Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const deletePurchase = actionClient
  .inputSchema(getPurchaseByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.purchases.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const deleted = db.purchases[idx];

        // Reverse stock if previously Received
        if (deleted.status === "Received") {
          const oldItems = db.purchaseItems.filter((item) => item.purchaseId === id);
          oldItems.forEach((item) => {
            const product = db.products.find((p) => p.id === item.productId);
            if (product) {
              product.stock = Math.max(0, product.stock - item.quantity);
            }
          });

          // Reverse supplier purchaseDue
          const supplier = db.suppliers.find((s) => s.id === deleted.supplierId);
          if (supplier) {
            supplier.purchaseDue = Math.max(0, (supplier.purchaseDue || 0) - deleted.paymentDue);
          }
        }

        db.purchaseItems = db.purchaseItems.filter((item) => item.purchaseId !== id);
        db.purchasePayments = db.purchasePayments.filter((p) => p.purchaseId !== id);
        db.purchases.splice(idx, 1);

        revalidatePath("/purchases");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete Purchase Error:", error);
      return null;
    }
  });

export const updatePurchaseStatus = actionClient
  .inputSchema(z.object({ id: z.string(), status: purchaseStatusEnum }))
  .action(async (values) => {
    const { id, status } = values.parsedInput;

    try {
      const idx = db.purchases.findIndex((p) => p.id === id);
      if (idx === -1) return { error: "Purchase not found" };

      const currentPurchase = db.purchases[idx];
      const prevStatus = currentPurchase.status;

      currentPurchase.status = status;
      currentPurchase.updatedAt = new Date();

      const items = db.purchaseItems.filter((item) => item.purchaseId === id);

      if (status === "Received" && prevStatus !== "Received") {
        items.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.purchasePrice = Math.round(item.unitPrice);
            product.stock += item.quantity;
          }
        });

        // Update supplier balance
        if (currentPurchase.paymentDue > 0) {
          const supplier = db.suppliers.find((s) => s.id === currentPurchase.supplierId);
          if (supplier) {
            supplier.purchaseDue = (supplier.purchaseDue || 0) + currentPurchase.paymentDue;
          }
        }
      } else if (prevStatus === "Received" && status !== "Received") {
        items.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        });

        // Reverse supplier balance
        if (currentPurchase.paymentDue > 0) {
          const supplier = db.suppliers.find((s) => s.id === currentPurchase.supplierId);
          if (supplier) {
            supplier.purchaseDue = Math.max(0, (supplier.purchaseDue || 0) - currentPurchase.paymentDue);
          }
        }
      }

      revalidatePath("/purchases");
      return { data: currentPurchase };
    } catch (error) {
      console.error("Update Purchase Status Error:", error);
      return { error: "Something went wrong" };
    }
  });
