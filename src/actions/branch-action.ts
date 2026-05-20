// src/actions/branch-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import { branchSchema, deleteBranchSchema, updateBranchSchema } from '@/schemas/branch-schema';
import { revalidatePath } from 'next/cache';

export const createBranch = actionClient.inputSchema(branchSchema)
  .action(async (values) => {
    try {
      const newBranch = {
        id: `branch-${Date.now()}`,
        ...values.parsedInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.branches.push(newBranch);
      revalidatePath('/branch');
      return { data: newBranch };
    } catch (error) {
      console.error("Created Branch Error :", error);
      return { error: "Something went wrong" };
    }
  });

export const getBranchList = actionClient.action(async () => {
  try {
    revalidatePath("/branch");
    return { data: db.branches };
  } catch (error) {
    console.error("Get Branch Error :", error);
    return { error: "Something went wrong" };
  }
});

export const getBranchlistForDropdown = async () => {
  return db.branches.map(b => ({ id: b.id, name: b.name }));
};

export const updateBranch = actionClient.inputSchema(updateBranchSchema).action(async (values) => {
  const { id, ...data } = values.parsedInput;
  try {
    const branch = db.branches.find(b => b.id === id);
    if (branch) {
      Object.assign(branch, data);
      branch.updatedAt = new Date();
      revalidatePath('/branch');
      return { data: branch };
    }
    return { error: "Branch not found" };
  } catch (error) {
    console.error("Error on Branch Updating :", error);
    return { error: "Something went wrong" };
  }
});

export const deleteBranch = actionClient.inputSchema(deleteBranchSchema).action(async (values) => {
  const { id } = values.parsedInput;
  try {
    const idx = db.branches.findIndex(b => b.id === id);
    if (idx !== -1) {
      const deleted = db.branches[idx];
      db.branches.splice(idx, 1);
      revalidatePath('/branch');
      return deleted;
    }
    return null;
  } catch (error) {
    console.error("Delete Branch Error:", error);
    return null;
  }
});
