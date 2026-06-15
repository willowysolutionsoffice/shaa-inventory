// src/constants/permissions.ts
// Single source of truth for all permissions and role→permission mappings

export const PERMISSIONS = {
  // General
  VIEW_DASHBOARD:    "view_dashboard",
  VIEW_REPORTS:      "view_reports",
  // Inventory
  MANAGE_PRODUCTS:   "manage_products",
  MANAGE_BRANCHES:   "manage_branches",
  // Parties
  MANAGE_CUSTOMERS:  "manage_customers",
  MANAGE_SUPPLIERS:  "manage_suppliers",
  // Transactions
  MANAGE_SALES:      "manage_sales",
  MANAGE_PURCHASES:  "manage_purchases",
  MANAGE_RETURNS:    "manage_returns",
  // Finance
  MANAGE_EXPENSES:   "manage_expenses",
  // Admin
  MANAGE_USERS:      "manage_users",
  MANAGE_ROLES:      "manage_roles",
  MANAGE_BRANDS: 'manage_brands',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Role → Permission map ─────────────────────────────────────────────────────
// This is the authoritative mapping. The mock roles in auth.ts use `value` fields
// (e.g. "store_manager"). Map each value to its permissions here.

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.MANAGE_PURCHASES,
    PERMISSIONS.MANAGE_RETURNS,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_BRANDS,
  ],
  store_manager: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.MANAGE_RETURNS,
    PERMISSIONS.MANAGE_EXPENSES,
  ],
  purchase_manager: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.MANAGE_PURCHASES,
    PERMISSIONS.MANAGE_RETURNS,
  ],
  billing_staff: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_RETURNS,
  ],
  accountant: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.MANAGE_PURCHASES,
  ],
  // fallback for legacy "user" role
  user: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_SALES,
  ],
};

/** Get permissions for a role value string */
export function getPermissionsForRole(roleValue: string): Permission[] {
  return ROLE_PERMISSIONS[roleValue] ?? [PERMISSIONS.VIEW_DASHBOARD];
}

/** Check if a role has a specific permission */
export function roleHasPermission(roleValue: string, permission: Permission): boolean {
  return getPermissionsForRole(roleValue).includes(permission);
}