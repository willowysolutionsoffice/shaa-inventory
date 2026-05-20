import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10),
});


export const updateBranchSchema = branchSchema.extend({
  id: z.string(),
});

export const deleteBranchSchema = z.object({
  id: z.string(),
});

export type BranchInput = z.infer<typeof branchSchema>;
