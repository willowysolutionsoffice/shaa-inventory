// src/actions/customer-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  customerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
} from "@/schemas/customer-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const createCustomer = actionClient.inputSchema(customerSchema).action(
  async (values) => {
    try {
      const { name, email, phone, ...otherData } = values.parsedInput;

      const existingName = db.customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (existingName) return { error: "A customer with this name already exists" };

      if (email) {
        const existingEmail = db.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase());
        if (existingEmail) return { error: "A customer with this email already exists" };
      }

      if (phone) {
        const existingPhone = db.customers.find((c) => c.phone === phone);
        if (existingPhone) return { error: "A customer with this phone number already exists" };
      }

      const newCustomer = {
        id: `cust-${Date.now()}`,
        name,
        email: email || undefined,
        phone: phone || undefined,
        openingBalance: otherData.openingBalance || 0,
        outstandingPayments: 0,
        salesDue: 0,
        salesReturnDue: 0,
        branchId: otherData.branchId || "main-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.customers.push(newCustomer);
      revalidatePath("/customers");
      return { data: newCustomer };
    } catch (error: any) {
      console.error("Create Customer Error:", error);
      return { error: error?.message || "Failed to create customer. Please try again." };
    }
  }
);

export const getCustomerList = actionClient.action(async () => {
  try {
    const balancePaidMap = new Map();
    db.balancePayments.forEach((b) => {
      if (b.customerId) {
        const curr = balancePaidMap.get(b.customerId) || 0;
        balancePaidMap.set(b.customerId, curr + b.amount);
      }
    });

    const adjustedCustomers = db.customers.map((c) => {
      const generalPaid = balancePaidMap.get(c.id) || 0;
      const openingPaid = Math.min(c.openingBalance, generalPaid);
      let effectiveOpening = c.openingBalance - openingPaid;
      let effectiveSalesDue = (c.salesDue || 0) + openingPaid;

      if (effectiveSalesDue < 0) {
        const remainingCredit = Math.abs(effectiveSalesDue);
        const absorption = Math.min(effectiveOpening, remainingCredit);
        effectiveOpening -= absorption;
        effectiveSalesDue += absorption;
      }

      return { ...c, openingBalance: effectiveOpening, salesDue: effectiveSalesDue };
    });

    const calculatedTotals = adjustedCustomers.reduce(
      (acc, curr) => ({
        openingBalance:      acc.openingBalance      + (curr.openingBalance      || 0),
        outstandingPayments: acc.outstandingPayments  + (curr.outstandingPayments || 0),
        salesDue:            acc.salesDue             + (curr.salesDue            || 0),
        salesReturnDue:      acc.salesReturnDue       + (curr.salesReturnDue      || 0),
      }),
      { openingBalance: 0, outstandingPayments: 0, salesDue: 0, salesReturnDue: 0 }
    );

    return { customers: adjustedCustomers, totals: calculatedTotals };
  } catch (error) {
    console.error("Get Customers Error:", error);
    return { error: "Something went wrong" };
  }
});

// ── NEW: fetch a single customer with full history ────────────────────────────
export const getCustomerById = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async (values) => {
    try {
      const { id } = values.parsedInput;

      const customer = db.customers.find((c) => c.id === id);
      if (!customer) return { error: "Customer not found" };

      // Apply same balance adjustments as getCustomerList
      const balancePaid = db.balancePayments
        .filter((b) => b.customerId === id)
        .reduce((s, b) => s + b.amount, 0);

      const openingPaid     = Math.min(customer.openingBalance, balancePaid);
      let effectiveOpening  = customer.openingBalance - openingPaid;
      let effectiveSalesDue = (customer.salesDue || 0) + openingPaid;
      if (effectiveSalesDue < 0) {
        const credit     = Math.abs(effectiveSalesDue);
        const absorption = Math.min(effectiveOpening, credit);
        effectiveOpening  -= absorption;
        effectiveSalesDue += absorption;
      }

      // Sales with items, payments, branch
      const sales = db.sales
        .filter((s) => s.customerId === id)
        .map((sale) => ({
          ...sale,
          items: db.saleItems
            .filter((i) => i.saleId === sale.id)
            .map((i) => ({
              ...i,
              product: db.products.find((p) => p.id === i.productId) ?? null,
            })),
          payments: db.salesPayments.filter((p) => p.saleId === sale.id),
          branch:   db.branches.find((b) => b.id === sale.branchId) ?? null,
        }))
        .sort((a, b) => new Date(b.salesdate).getTime() - new Date(a.salesdate).getTime());

      // Returns with items, branch
      const returns = db.salesReturns
        .filter((r) => r.customerId === id)
        .map((ret) => ({
          ...ret,
          items: db.salesReturnItems
            .filter((i) => i.salesReturnId === ret.id)
            .map((i) => ({
              ...i,
              product: db.products.find((p) => p.id === i.productId) ?? null,
            })),
          branch: db.branches.find((b) => b.id === ret.branchId) ?? null,
        }))
        .sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());

      // Balance payments
      const balancePayments = db.balancePayments
        .filter((p) => p.customerId === id)
        .sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime());

      // Loyalty calculation
      const totalSpent    = sales.reduce((s, sale) => s + sale.grandTotal, 0);
      const totalReturned = returns.reduce((s, r) => s + r.grandTotal, 0);
      const loyaltyPoints = Math.floor((totalSpent - totalReturned) / 100);
      const loyaltyTier   =
        loyaltyPoints >= 1000 ? "Platinum" :
        loyaltyPoints >= 500  ? "Gold"     :
        loyaltyPoints >= 200  ? "Silver"   : "Bronze";

      return {
        customer: {
          ...customer,
          openingBalance: effectiveOpening,
          salesDue:       effectiveSalesDue,
        },
        sales,
        returns,
        balancePayments,
        loyaltyPoints,
        loyaltyTier,
        totalSpent,
        totalReturned,
      };
    } catch (error) {
      console.error("Get Customer By ID Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getCustomerListForDropdown = async () => {
  return db.customers.map((c) => {
    let effectiveOpening = c.openingBalance;
    const salesDue  = c.salesDue || 0;
    const totalDue  = effectiveOpening + salesDue;
    if (totalDue <= 0) {
      effectiveOpening = 0;
    } else {
      if (salesDue < 0) effectiveOpening = totalDue;
    }
    return { id: c.id, name: c.name, openingBalance: effectiveOpening };
  });
};

export const updateCustomer = actionClient.inputSchema(updateCustomerSchema).action(
  async (values) => {
    const { id, name, email, phone, ...otherData } = values.parsedInput;
    try {
      const idx = db.customers.findIndex((c) => c.id === id);
      if (idx === -1) return { error: "Customer not found" };

      const existingName = db.customers.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
      if (existingName) return { error: "A customer with this name already exists" };

      if (email) {
        const existingEmail = db.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase() && c.id !== id);
        if (existingEmail) return { error: "A customer with this email already exists" };
      }

      if (phone) {
        const existingPhone = db.customers.find((c) => c.phone === phone && c.id !== id);
        if (existingPhone) return { error: "A customer with this phone number already exists" };
      }

      const updated = {
        ...db.customers[idx],
        name,
        email: email || undefined,
        phone: phone || undefined,
        ...otherData,
        updatedAt: new Date(),
      };

      db.customers[idx] = updated;
      revalidatePath("/customers");
      return { data: updated };
    } catch (error: any) {
      console.error("Update Customer Error:", error);
      return { error: error?.message || "Failed to update customer. Please try again." };
    }
  }
);

export const deleteCustomer = actionClient.inputSchema(deleteCustomerSchema).action(
  async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.customers.findIndex((c) => c.id === id);
      if (idx !== -1) {
        const deleted = db.customers[idx];
        db.customers.splice(idx, 1);
        revalidatePath("/customers");
        return { data: deleted };
      }
      return { error: "Customer not found" };
    } catch (error) {
      console.error("Delete Customer Error:", error);
      return { error: "Something went wrong" };
    }
  }
);