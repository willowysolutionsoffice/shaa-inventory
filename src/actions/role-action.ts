// src/actions/role-action.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";
import {
  roleSchema,
  updateRoleSchema,
  deleteRoleSchema,
} from "@/schemas/role-schema";
import { revalidatePath } from "next/cache";

// ── CREATE ─────────────────────────────────────────────────────────────────────
export const createRole = actionClient.inputSchema(roleSchema).action(
  async (values) => {
    try {
      const { name, ...rest } = values.parsedInput;

      const existing = db.roles.find(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return { error: "A role with this name already exists" };
      }

      const newRole = {
        id: `role-${Date.now()}`,
        name,
        description: rest.description ?? "",
        permissions: rest.permissions,
        color: rest.color,
        status: rest.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.roles.push(newRole);
      revalidatePath("/roles");
      return { data: newRole };
    } catch (error: any) {
      console.error("Create Role Error:", error);
      return { error: error?.message || "Failed to create role. Please try again." };
    }
  }
);

// ── GET LIST ───────────────────────────────────────────────────────────────────
export const getRoleList = actionClient.action(async () => {
  try {
    // Attach live user count to each role
    const rolesWithCount = db.roles.map((role) => ({
      ...role,
      userCount: db.users.filter((u) => u.roleId === role.id).length,
    }));

    return { data: rolesWithCount };
  } catch (error) {
    console.error("Get Roles Error:", error);
    return { error: "Something went wrong" };
  }
});

// ── GET FOR DROPDOWN ───────────────────────────────────────────────────────────
export const getRoleListForDropdown = async () => {
  return db.roles
    .filter((r) => r.status === "Active")
    .map((r) => ({ id: r.id, name: r.name }));
};

// ── UPDATE ─────────────────────────────────────────────────────────────────────
export const updateRole = actionClient.inputSchema(updateRoleSchema).action(
  async (values) => {
    const { id, name, ...rest } = values.parsedInput;
    try {
      const idx = db.roles.findIndex((r) => r.id === id);
      if (idx === -1) {
        return { error: "Role not found" };
      }

      const duplicate = db.roles.find(
        (r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== id
      );
      if (duplicate) {
        return { error: "A role with this name already exists" };
      }

      const updated = {
        ...db.roles[idx],
        name,
        description: rest.description ?? "",
        permissions: rest.permissions,
        color: rest.color,
        status: rest.status,
        updatedAt: new Date(),
      };

      db.roles[idx] = updated;
      revalidatePath("/roles");
      return { data: updated };
    } catch (error: any) {
      console.error("Update Role Error:", error);
      return { error: error?.message || "Failed to update role. Please try again." };
    }
  }
);

// ── DELETE ─────────────────────────────────────────────────────────────────────
export const deleteRole = actionClient.inputSchema(deleteRoleSchema).action(
  async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.roles.findIndex((r) => r.id === id);
      if (idx === -1) {
        return { error: "Role not found" };
      }

      // Prevent deletion if users are assigned
      const assignedUsers = db.users.filter((u) => u.roleId === id);
      if (assignedUsers.length > 0) {
        return {
          error: `Cannot delete: ${assignedUsers.length} user(s) are assigned this role. Reassign them first.`,
        };
      }

      const deleted = db.roles[idx];
      db.roles.splice(idx, 1);
      revalidatePath("/roles");
      return { data: deleted };
    } catch (error) {
      console.error("Delete Role Error:", error);
      return { error: "Something went wrong" };
    }
  }
);

// ── TOGGLE STATUS ──────────────────────────────────────────────────────────────
export const toggleRoleStatus = actionClient
  .inputSchema(deleteRoleSchema) // reuse { id } shape
  .action(async (values) => {
    const { id } = values.parsedInput;
    try {
      const idx = db.roles.findIndex((r) => r.id === id);
      if (idx === -1) return { error: "Role not found" };

      db.roles[idx] = {
        ...db.roles[idx],
        status: db.roles[idx].status === "Active" ? "Inactive" : "Active",
        updatedAt: new Date(),
      };

      revalidatePath("/roles");
      return { data: db.roles[idx] };
    } catch (error) {
      console.error("Toggle Role Status Error:", error);
      return { error: "Something went wrong" };
    }
  });