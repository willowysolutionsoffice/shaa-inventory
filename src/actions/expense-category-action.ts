// src/actions/expense-category-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  expenseCategorySchema,
  deleteExpenseCategorySchema,
  updateExpenseCategorySchema,
} from "@/schemas/expense-category-schema";
import { revalidatePath } from "next/cache";

export const createExpenseCategory = actionClient.inputSchema(expenseCategorySchema)
  .action(async (values) => {
    try {
      const newCategory = {
        id: `cat-${Date.now()}`,
        ...values.parsedInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.categories.push(newCategory);
      revalidatePath("/expense-categories");
      return { data: newCategory };
    } catch (error) {
      console.error("Create ExpenseCategory Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const getExpenseCategoryList = actionClient.action(async () => {
  try {
    revalidatePath("/expense-categories");
    return { data: db.categories };
  } catch (error) {
    console.error("Get ExpenseCategory Error:", error);
    return { error: "Something went wrong" };
  }
});

export const getExpenseCategoryDropdown = async () => {
  return db.categories.map(c => ({ id: c.id, name: c.name }));
};

export const updateExpenseCategory = actionClient.inputSchema(updateExpenseCategorySchema)
  .action(async (values) => {
    const { id, ...data } = values.parsedInput;
    try {
      const category = db.categories.find(c => c.id === id);
      if (category) {
        Object.assign(category, data);
        category.updatedAt = new Date();
        revalidatePath("/expense-categories");
        return { data: category };
      }
      return { error: "Category not found" };
    } catch (error) {
      console.error("Update ExpenseCategory Error:", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteExpenseCategory = actionClient.inputSchema(deleteExpenseCategorySchema)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        const deleted = db.categories[idx];
        db.categories.splice(idx, 1);
        revalidatePath("/expense-categories");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete ExpenseCategory Error:", error);
      return null;
    }
  });
