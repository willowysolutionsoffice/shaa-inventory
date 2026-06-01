// src/schemas/role-schema.ts
import { z } from "zod";

export const PERMISSIONS = [
  "view_dashboard",
  "view_reports",
  "manage_products",
  "manage_branches",
  "manage_customers",
  "manage_suppliers",
  "manage_sales",
  "manage_purchases",
  "manage_returns",
  "manage_expenses",
  "manage_users",
  "manage_roles",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_COLORS = ["purple", "blue", "green", "orange", "gray"] as const;
export type RoleColor = (typeof ROLE_COLORS)[number];

export const roleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be under 50 characters"),
  description: z
    .string()
    .max(200, "Description must be under 200 characters")
    .optional()
    .default(""),
  permissions: z
    .array(z.enum(PERMISSIONS))
    .min(1, "At least one permission is required"),
  color: z.enum(ROLE_COLORS).default("purple"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const updateRoleSchema = roleSchema.extend({
  id: z.string().min(1, "Role ID is required"),
});

export const deleteRoleSchema = z.object({
  id: z.string().min(1, "Role ID is required"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
export type UpdateRoleValues = z.infer<typeof updateRoleSchema>;
export type DeleteRoleValues = z.infer<typeof deleteRoleSchema>;