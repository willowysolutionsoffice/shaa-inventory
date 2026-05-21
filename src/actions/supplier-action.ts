// src/actions/supplier-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  supplierSchema,
  updateSupplierSchema,
  deleteSupplierSchema,
} from "@/schemas/supplier-schema";
import { revalidatePath } from "next/cache";

export const createSupplier = actionClient.inputSchema(supplierSchema).action(
  async (values) => {
    try {
      const { name, email, phone, ...otherData } = values.parsedInput;

      // Uniqueness checks in mock database
      const existingName = db.suppliers.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (existingName) {
        return { error: "A supplier with this name already exists" };
      }

      if (email) {
        const existingEmail = db.suppliers.find((s) => s.email?.toLowerCase() === email.toLowerCase());
        if (existingEmail) {
          return { error: "A supplier with this email already exists" };
        }
      }

      if (phone) {
        const existingPhone = db.suppliers.find((s) => s.phone === phone);
        if (existingPhone) {
          return { error: "A supplier with this phone number already exists" };
        }
      }

      const newSupplier = {
        id: `sup-${Date.now()}`,
        name,
        email: email || undefined,
        phone: phone || undefined,
        openingBalance: otherData.openingBalance || 0,
        purchaseDue: 0,
        purchaseReturnDue: 0,
        branchId: otherData.branchId || "main-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.suppliers.push(newSupplier);
      revalidatePath("/suppliers");
      return { data: newSupplier };
    } catch (error: any) {
      console.error("Create Supplier Error:", error);
      return { error: error?.message || "Failed to create supplier. Please try again." };
    }
  }
);

export const getSupplierList = actionClient.action(async () => {
  try {
    const balancePaidMap = new Map();
    db.balancePayments.forEach((b) => {
      if (b.supplierId) {
        const curr = balancePaidMap.get(b.supplierId) || 0;
        balancePaidMap.set(b.supplierId, curr + b.amount);
      }
    });

    const adjustedSuppliers = db.suppliers.map((s) => {
      const generalPaid = balancePaidMap.get(s.id) || 0;

      const openingPaid = Math.min(s.openingBalance, generalPaid);
      let effectiveOpening = s.openingBalance - openingPaid;
      let effectivePurchaseDue = (s.purchaseDue || 0) + openingPaid;

      if (effectivePurchaseDue < 0) {
        const remainingCredit = Math.abs(effectivePurchaseDue);
        const absorption = Math.min(effectiveOpening, remainingCredit);
        effectiveOpening -= absorption;
        effectivePurchaseDue += absorption;
      }

      return {
        ...s,
        openingBalance: effectiveOpening,
        purchaseDue: effectivePurchaseDue,
      };
    });

    const calculatedTotals = adjustedSuppliers.reduce(
      (acc, curr) => ({
        openingBalance: acc.openingBalance + (curr.openingBalance || 0),
        purchaseDue: acc.purchaseDue + (curr.purchaseDue || 0),
        purchaseReturnDue: acc.purchaseReturnDue + (curr.purchaseReturnDue || 0),
      }),
      { openingBalance: 0, purchaseDue: 0, purchaseReturnDue: 0 }
    );

    return {
      suppliers: adjustedSuppliers,
      totals: calculatedTotals,
    };
  } catch (error) {
    console.error("Get Suppliers Error:", error);
    return { error: "Something went wrong" };
  }
});

export const getSupplierListForDropdown = async () => {
  return db.suppliers.map((s) => {
    let effectiveOpening = s.openingBalance;
    const purchaseDue = s.purchaseDue || 0;
    const totalDue = effectiveOpening + purchaseDue;

    if (totalDue <= 0) {
      effectiveOpening = 0;
    } else {
      if (purchaseDue < 0) {
        effectiveOpening = totalDue;
      }
    }

    return {
      id: s.id,
      name: s.name,
      openingBalance: effectiveOpening,
    };
  });
};

export const updateSupplier = actionClient.inputSchema(updateSupplierSchema).action(
  async (values) => {
    const { id, name, email, phone, ...otherData } = values.parsedInput;
    try {
      const idx = db.suppliers.findIndex((s) => s.id === id);
      if (idx === -1) {
        return { error: "Supplier not found" };
      }

      // Uniqueness checks in mock database
      const existingName = db.suppliers.find((s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== id);
      if (existingName) {
        return { error: "A supplier with this name already exists" };
      }

      if (email) {
        const existingEmail = db.suppliers.find((s) => s.email?.toLowerCase() === email.toLowerCase() && s.id !== id);
        if (existingEmail) {
          return { error: "A supplier with this email already exists" };
        }
      }

      if (phone) {
        const existingPhone = db.suppliers.find((s) => s.phone === phone && s.id !== id);
        if (existingPhone) {
          return { error: "A supplier with this phone number already exists" };
        }
      }

      const updated = {
        ...db.suppliers[idx],
        name,
        email: email || undefined,
        phone: phone || undefined,
        ...otherData,
        updatedAt: new Date(),
      };

      db.suppliers[idx] = updated;
      revalidatePath("/suppliers");
      return { data: updated };
    } catch (error: any) {
      console.error("Update Supplier Error:", error);
      return { error: error?.message || "Failed to update supplier. Please try again." };
    }
  }
);

export const deleteSupplier = actionClient.inputSchema(deleteSupplierSchema).action(
  async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.suppliers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        const deleted = db.suppliers[idx];
        db.suppliers.splice(idx, 1);
        revalidatePath("/suppliers");
        return { data: deleted };
      }
      return { error: "Supplier not found" };
    } catch (error) {
      console.error("Delete Supplier Error:", error);
      return { error: "Something went wrong" };
    }
  }
);
