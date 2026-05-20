// src/actions/sales-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  fullSalesSchema,
  getSalesByIdSchema,
  salesUpdateSchema,
} from "@/schemas/sales-item-schema";
import { SalesStatusEnum } from "@/schemas/sales-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Helper generator for invoices
const generateInvoiceNo = () => `INV-2026-${String(db.sales.length + 1).padStart(3, '0')}`;

export const createSale = actionClient
  .inputSchema(fullSalesSchema)
  .action(async (values) => {
    try {
      const {
        items: rawItems,
        salesPayment: rawSalesPayment,
        status,
        ...saleData
      } = values.parsedInput;

      const grandTotal = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const paidAmount = rawSalesPayment.reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount = grandTotal - paidAmount;
      const saleId = `sale-${Date.now()}`;

      const newSale = {
        id: saleId,
        invoiceNo: generateInvoiceNo(),
        salesdate: saleData.salesdate ? new Date(saleData.salesdate) : new Date(),
        customerId: saleData.customerId,
        branchId: saleData.branchId || "main-branch",
        grandTotal,
        paymentStatus: dueAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
        paymentDue: dueAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.sales.push(newSale);

      // Add payments
      rawSalesPayment.forEach((p, idx) => {
        if ((p.amount || 0) > 0) {
          db.salesPayments.push({
            id: `spay-${Date.now()}-${idx}`,
            saleId,
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
        db.saleItems.push({
          id: `sitem-${Date.now()}-${idx}`,
          saleId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: item.subtotal || (item.quantity * item.unitPrice),
          total: item.total || (item.quantity * item.unitPrice),
          purchasePrice: item.purchasePrice || 0,
          sellingPrice: item.unitPrice,
        });

        // Decrement stock if Dispatched
        if (status === "Dispatched") {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        }
      });

      // Update customer salesDue
      const customer = db.customers.find((c) => c.id === saleData.customerId);
      if (customer) {
        customer.salesDue = (customer.salesDue || 0) + dueAmount;
      }

      revalidatePath("/sales");
      return { data: newSale };
    } catch (error) {
      console.error("Create Sale Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getSalesList = actionClient
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
      
      let filtered = [...db.sales];

      if (from || to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        filtered = filtered.filter((sale) => {
          const d = new Date(sale.salesdate);
          if (fromDate && d < fromDate) return false;
          if (toDate && d > toDate) return false;
          return true;
        });
      }

      filtered.sort((a, b) => b.salesdate.getTime() - a.salesdate.getTime());

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginated = filtered.slice(skip, skip + limit);

      const sales = paginated.map((sale) => {
        const saleItems = db.saleItems
          .filter((item) => item.saleId === sale.id)
          .map((item) => ({
            ...item,
            product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown" },
          }));

        const payments = db.salesPayments.filter((p) => p.saleId === sale.id);

        return {
          ...sale,
          customer: db.customers.find((c) => c.id === sale.customerId) || { name: "Unknown", openingBalance: 0 },
          items: saleItems,
          payments,
          branch: db.branches.find((b) => b.id === sale.branchId) || { name: "Unknown" },
        };
      });

      const grandTotalSum = filtered.reduce((sum, s) => sum + s.grandTotal, 0);
      const dueAmountSum = filtered.reduce((sum, s) => sum + s.paymentDue, 0);
      const paidAmountSum = grandTotalSum - dueAmountSum;

      return {
        sales,
        metadata: {
          totalPages,
          totalCount,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        totals: {
          grandTotal: grandTotalSum,
          dueAmount: dueAmountSum,
          paidAmount: paidAmountSum,
        },
      };
    } catch (error) {
      console.error("Get Sales List Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getSaleById = actionClient
  .inputSchema(getSalesByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    const sale = db.sales.find((s) => s.id === id);
    if (!sale) return { data: null };

    const items = db.saleItems
      .filter((item) => item.saleId === sale.id)
      .map((item) => ({
        ...item,
        product: db.products.find((p) => p.id === item.productId) || { product_name: "Unknown", stock: 0 },
      }));

    const payments = db.salesPayments.filter((p) => p.saleId === sale.id);

    return {
      data: {
        ...sale,
        items,
        customer: db.customers.find((c) => c.id === sale.customerId) || { name: "Unknown", openingBalance: 0 },
        payments,
        branch: db.branches.find((b) => b.id === sale.branchId) || { name: "Unknown" },
      },
    };
  });

export const updateSale = actionClient
  .inputSchema(salesUpdateSchema)
  .action(async (values) => {
    const {
      id,
      items: rawItems,
      salesPayment: rawSalesPayment,
      status,
      ...data
    } = values.parsedInput;

    try {
      const idx = db.sales.findIndex((s) => s.id === id);
      if (idx === -1) return { error: "Sale not found" };

      const oldSale = db.sales[idx];
      const oldDue = oldSale.paymentDue;

      // Reverse stock if previously Dispatched
      // Here we simulate it
      const oldItems = db.saleItems.filter((item) => item.saleId === id);
      oldItems.forEach((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
        }
      });

      // Clear old items and payments
      db.saleItems = db.saleItems.filter((item) => item.saleId !== id);
      db.salesPayments = db.salesPayments.filter((p) => p.saleId !== id);

      const grandTotal = rawItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const paidAmount = rawSalesPayment.reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount = grandTotal - paidAmount;

      const updatedSale = {
        ...oldSale,
        salesdate: data.salesdate ? new Date(data.salesdate) : oldSale.salesdate,
        customerId: data.customerId || oldSale.customerId,
        branchId: data.branchId || oldSale.branchId,
        status: status || oldSale.paymentStatus,
        grandTotal,
        paymentStatus: dueAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
        paymentDue: dueAmount,
        updatedAt: new Date(),
      };

      db.sales[idx] = updatedSale;

      // Add new items and payments
      rawItems.forEach((item, index) => {
        db.saleItems.push({
          id: `sitem-${Date.now()}-${index}`,
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: item.subtotal || (item.quantity * item.unitPrice),
          total: item.total || (item.quantity * item.unitPrice),
          purchasePrice: item.purchasePrice || 0,
          sellingPrice: item.unitPrice,
        });

        // Decrement stock if Dispatched
        if (status === "Dispatched") {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        }
      });

      rawSalesPayment.forEach((p, index) => {
        if ((p.amount || 0) > 0) {
          db.salesPayments.push({
            id: `spay-${Date.now()}-${index}`,
            saleId: id,
            amount: p.amount,
            paidOn: p.paidOn ? new Date(p.paidOn) : new Date(),
            paymentMethod: p.paymentMethod,
            paymentNote: p.paymentNote || null,
            dueDate: p.dueDate ? new Date(p.dueDate) : null,
          });
        }
      });

      // Update customer salesDue
      const customer = db.customers.find((c) => c.id === updatedSale.customerId);
      if (customer) {
        customer.salesDue = (customer.salesDue || 0) - oldDue + dueAmount;
      }

      revalidatePath("/sales");
      return { data: updatedSale };
    } catch (error) {
      console.error("Update Sale Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const updateSalesStatus = actionClient
  .inputSchema(z.object({ id: z.string(), status: SalesStatusEnum }))
  .action(async (values) => {
    const { id, status } = values.parsedInput;

    try {
      const idx = db.sales.findIndex((s) => s.id === id);
      if (idx === -1) return { error: "Sale not found" };

      const currentSale = db.sales[idx];
      const prevStatus = currentSale.paymentStatus;
      
      currentSale.paymentStatus = status;
      currentSale.updatedAt = new Date();

      // Handle stock adjustments
      const items = db.saleItems.filter((item) => item.saleId === id);
      
      if (status === "Dispatched" && prevStatus !== "Dispatched") {
        items.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        });
      } else if (prevStatus === "Dispatched" && status !== "Dispatched") {
        items.forEach((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock += item.quantity;
          }
        });
      }

      revalidatePath("/sales");
      return { data: currentSale };
    } catch (error) {
      console.error("Update Sales Status Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteSale = actionClient
  .inputSchema(getSalesByIdSchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.sales.findIndex((s) => s.id === id);
      if (idx !== -1) {
        const deleted = db.sales[idx];
        
        // Reverse customer salesDue
        const customer = db.customers.find((c) => c.id === deleted.customerId);
        if (customer) {
          customer.salesDue = Math.max(0, (customer.salesDue || 0) - deleted.paymentDue);
        }

        // Delete associated items and payments
        db.saleItems = db.saleItems.filter((item) => item.saleId !== id);
        db.salesPayments = db.salesPayments.filter((p) => p.saleId !== id);
        db.sales.splice(idx, 1);

        revalidatePath("/sales");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete Sale Error:", error);
      return null;
    }
  });
