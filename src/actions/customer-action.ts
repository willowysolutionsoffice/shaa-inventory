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

export const createCustomer = actionClient.inputSchema(customerSchema).action(
  async (values) => {
    try {
      const { name, email, phone, ...otherData } = values.parsedInput;

      // Uniqueness checks in mock database
      const existingName = db.customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (existingName) {
        return { error: "A customer with this name already exists" };
      }

      if (email) {
        const existingEmail = db.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase());
        if (existingEmail) {
          return { error: "A customer with this email already exists" };
        }
      }

      if (phone) {
        const existingPhone = db.customers.find((c) => c.phone === phone);
        if (existingPhone) {
          return { error: "A customer with this phone number already exists" };
        }
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
    revalidatePath("/customers");

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

      return {
        ...c,
        openingBalance: effectiveOpening,
        salesDue: effectiveSalesDue,
      };
    });

    const calculatedTotals = adjustedCustomers.reduce(
      (acc, curr) => ({
        openingBalance: acc.openingBalance + (curr.openingBalance || 0),
        outstandingPayments: acc.outstandingPayments + (curr.outstandingPayments || 0),
        salesDue: acc.salesDue + (curr.salesDue || 0),
        salesReturnDue: acc.salesReturnDue + (curr.salesReturnDue || 0),
      }),
      { openingBalance: 0, outstandingPayments: 0, salesDue: 0, salesReturnDue: 0 }
    );

    return {
      customers: adjustedCustomers,
      totals: calculatedTotals,
    };
  } catch (error) {
    console.error("Get Customers Error:", error);
    return { error: "Something went wrong" };
  }
});

export const getCustomerListForDropdown = async () => {
  return db.customers.map((c) => {
    let effectiveOpening = c.openingBalance;
    const salesDue = c.salesDue || 0;
    const totalDue = effectiveOpening + salesDue;

    if (totalDue <= 0) {
      effectiveOpening = 0;
    } else {
      if (salesDue < 0) {
        effectiveOpening = totalDue;
      }
    }

    return {
      id: c.id,
      name: c.name,
      openingBalance: effectiveOpening,
    };
  });
};

export const updateCustomer = actionClient.inputSchema(updateCustomerSchema).action(
  async (values) => {
    const { id, name, email, phone, ...otherData } = values.parsedInput;
    try {
      const idx = db.customers.findIndex((c) => c.id === id);
      if (idx === -1) {
        return { error: "Customer not found" };
      }

      // Uniqueness checks in mock database
      const existingName = db.customers.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
      if (existingName) {
        return { error: "A customer with this name already exists" };
      }

      if (email) {
        const existingEmail = db.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase() && c.id !== id);
        if (existingEmail) {
          return { error: "A customer with this email already exists" };
        }
      }

      if (phone) {
        const existingPhone = db.customers.find((c) => c.phone === phone && c.id !== id);
        if (existingPhone) {
          return { error: "A customer with this phone number already exists" };
        }
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
