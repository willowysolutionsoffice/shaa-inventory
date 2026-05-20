// src/actions/expense-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  expenseSchema,
  getExpenseByList,
  updateExpenseSchema,
} from "@/schemas/expense-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const createExpense = actionClient
  .inputSchema(expenseSchema)
  .action(async (values) => {
    try {
      const { date, ...otherValues } = values.parsedInput;
      const newExpense = {
        id: `exp-${Date.now()}`,
        ...otherValues,
        expenseDate: date ? new Date(date) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.expenses.push(newExpense);
      revalidatePath("/expenses");
      return { data: newExpense };
    } catch (error) {
      console.error("Created expense Error :", error);
      return { error: "Something went wrong" };
    }
  });

export const getExpenseList = actionClient
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
      
      let filtered = [...db.expenses];

      if (from || to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        filtered = filtered.filter((exp) => {
          const d = new Date(exp.expenseDate);
          if (fromDate && d < fromDate) return false;
          if (toDate && d > toDate) return false;
          return true;
        });
      }

      // Sort by amount desc
      filtered.sort((a, b) => b.amount - a.amount);

      const totalCount = filtered.length;
      const skip = (page - 1) * limit;
      const paginated = filtered.slice(skip, skip + limit);

      const expense = paginated.map((exp) => ({
        ...exp,
        category: db.categories.find((c) => c.id === exp.categoryId) || { name: "Unknown" },
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const totalAmount = filtered.reduce((sum, exp) => sum + exp.amount, 0);

      return {
        expense,
        metadata: {
          totalPages,
          totalCount,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        totals: {
          amount: totalAmount,
        },
      };
    } catch (error) {
      console.error("Get expense Error :", error);
      return { error: "Something went wrong" };
    }
  });

export const updateExpense = actionClient
  .inputSchema(updateExpenseSchema)
  .action(async (values) => {
    try {
      const { id, date, ...otherData } = values.parsedInput;
      const idx = db.expenses.findIndex((exp) => exp.id === id);
      if (idx !== -1) {
        const updated = {
          ...db.expenses[idx],
          ...otherData,
          expenseDate: date ? new Date(date) : db.expenses[idx].expenseDate,
          updatedAt: new Date(),
        };
        db.expenses[idx] = updated;
        revalidatePath("/expenses");
        return { data: updated };
      }
      return { error: "Expense not found" };
    } catch (error) {
      console.error("Error on expense Updating :", error);
      return { error: "Something went wrong" };
    }
  });

export const deleteExpense = actionClient
  .inputSchema(getExpenseByList)
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.expenses.findIndex((exp) => exp.id === id);
      if (idx !== -1) {
        const deleted = db.expenses[idx];
        db.expenses.splice(idx, 1);
        revalidatePath("/expenses");
        return deleted;
      }
      return null;
    } catch (error) {
      console.error("Delete Expense Error:", error);
      return null;
    }
  });
