// src/constants/navigation.ts
// Permission-gated sidebar navigation with grouped sections (parent + children).
// Structure mirrors the old nested nav but every item carries a `permission` field.
// The sidebar filters children per-item; a group is hidden if ALL its children are filtered out.

import {
  LayoutDashboard,
  Receipt,
  ReceiptText,
  ShoppingBag,
  Users,
  Package,
  Warehouse,
  BookOpen,
  BarChart3,
  Boxes,
  Tag,
  Settings,
  Shield,
  Building2,
  UserCheck,
  HelpCircle,
  CreditCard,
  FolderTree,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  List,
  Undo2,
  History,
  Truck,
  TriangleAlert,
  ClipboardCheck
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type Permission, PERMISSIONS } from "./permissions";
import { APP_CONFIG } from "@/config/app";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavChild {
  title: string;
  url: string;
  icon?: LucideIcon;
  /** Hidden unless user has this permission. */
  permission?: Permission;
  /** Open this item in a new browser tab. */
  newTab?: boolean;
}

export interface NavGroup {
  title: string;
  url: string;
  icon: LucideIcon;
  /**
   * Top-level permission guard. If set, the entire group is hidden when the
   * user lacks this permission (even if some children would pass).
   * Omit to let child-level permissions control visibility individually.
   */
  permission?: Permission;
  /** Leaf items shown in the collapsible sub-menu. */
  children?: NavChild[];
  /** Open this group/leaf item in a new browser tab. */
  newTab?: boolean;
}

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * Returns true if the user should see this group at all.
 * A group is visible when:
 *   1. The group-level permission passes (or is absent), AND
 *   2. At least one child passes its permission check (or has no permission).
 */
export function isGroupVisible(
  group: NavGroup,
  userPermissions: Permission[]
): boolean {
  if (group.permission && !userPermissions.includes(group.permission)) {
    return false;
  }
  if (!group.children || group.children.length === 0) return true;
  return group.children.some(
    (child) => !child.permission || userPermissions.includes(child.permission)
  );
}

/** Filter a group's children to only those the user has permission to see. */
export function visibleChildren(
  group: NavGroup,
  userPermissions: Permission[]
): NavChild[] {
  return (group.children ?? []).filter(
    (child) => !child.permission || userPermissions.includes(child.permission)
  );
}

// ── Main nav ──────────────────────────────────────────────────────────────────

const navMain: NavGroup[] = [
  // ── Dashboard (no children) ────────────────────────────────────────────────
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },

  // ── Sales & Billing ────────────────────────────────────────────────────────
  {
    title: "Sales & Billing",
    url: "/sales",
    icon: Receipt,
    permission: PERMISSIONS.MANAGE_SALES,
    children: [
      {
        title: "POS Billing Terminal",
        url: "/sales/pos",
        icon: CreditCard,
        permission: PERMISSIONS.MANAGE_SALES,
      },
      {
        title: "Invoices",
        url: "/sales/pos/invoice",
        icon: ReceiptText,
        permission: PERMISSIONS.MANAGE_SALES,
        newTab: true,
      },
      {
        title: "List Sales",
        url: "/sales",
        icon: List,
        permission: PERMISSIONS.MANAGE_SALES,
        newTab: true,
      },
      {
        title: "Add Sale Order",
        url: "/sales/new",
        icon: PlusCircle,
        permission: PERMISSIONS.MANAGE_SALES,
        newTab: true,
      },
      {
        title: "Sales Returns",
        url: "/sales-return",
        icon: Undo2,
        permission: PERMISSIONS.MANAGE_RETURNS,
        newTab: true,
      },
      {
        title:"sales Report",
        url: "/reports/sales-report",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.MANAGE_SALES,
        newTab: true,
      
      }
    ],
  },

  // ── Purchases ──────────────────────────────────────────────────────────────
  {
    title: "Purchases",
    url: "/purchase",
    icon: ShoppingBag,
    permission: PERMISSIONS.MANAGE_PURCHASES,
    children: [
      {
        title: "List Purchases",
        url: "/purchase",
        icon: List,
        permission: PERMISSIONS.MANAGE_PURCHASES,
        newTab: true,
      },
      {
        title: "Add Purchase",
        url: "/purchase/new",
        icon: PlusCircle,
        permission: PERMISSIONS.MANAGE_PURCHASES,
        newTab: true,
      },
      {
        title: "Purchase Returns",
        url: "/purchase-return",
        icon: Undo2,
        permission: PERMISSIONS.MANAGE_RETURNS,
        newTab: true,
      },
      {
  title: "GRN Screen",
  url: "/admin/grn",
  icon: ClipboardCheck,
  permission: PERMISSIONS.MANAGE_PURCHASES,
},
{
  title: "GRN History",
  url: "/admin/grn/history",
  icon: History,
  permission: PERMISSIONS.MANAGE_PURCHASES,
},
    ],
  },

  // ── Customers & Contacts ───────────────────────────────────────────────────
  {
    title: "Customers & Contacts",
    url: "/admin/customers",
    icon: Users,
    children: [
      {
        title: "Customers",
        url: "/admin/customers",
        icon: UserCheck,
        permission: PERMISSIONS.MANAGE_CUSTOMERS,
      },
      {
        title: "Suppliers",
        url: "/admin/supplier",
        icon: UserCheck,
        permission: PERMISSIONS.MANAGE_SUPPLIERS,
      },
    ],
  },

  // ── Products ───────────────────────────────────────────────────────────────
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
    permission: PERMISSIONS.MANAGE_PRODUCTS,
    children: [
      {
        title: "All Products",
        url: "/admin/products",
        icon: List,
        permission: PERMISSIONS.MANAGE_PRODUCTS,
        newTab: true,
      },
      {
  title: "Brands",
  url: "/admin/brands",
  icon: Tag,
  permission: PERMISSIONS.MANAGE_PRODUCTS,
},
{
  title: "Sub-brands",
  url: "/admin/sub-brands",
  icon: Layers,
  permission: PERMISSIONS.MANAGE_PRODUCTS,
},

      
      {
        title: "Categories",
        url: "/admin/products/categories",
        icon: FolderTree,
        permission: PERMISSIONS.MANAGE_PRODUCTS,
      },
      {
        title: "Variations",
        url: "/admin/variations",
        icon: Layers,
        permission: PERMISSIONS.MANAGE_PRODUCTS,
      },
    ],
  },

  // ── Inventory ──────────────────────────────────────────────────────────────
  {
    title: "Inventory",
    url: "/admin/stock-adjustment",
    icon: Warehouse,
    permission: PERMISSIONS.MANAGE_PRODUCTS,
    children: [
      {
        title: "Stock Adjustments",
        url: "/admin/stock-adjustment",
        icon: PlusCircle,
        permission: PERMISSIONS.MANAGE_PRODUCTS,
      },
      {
        title: "Stock Tranfers",
        url: "/admin/stock-transfer",
        icon: Truck,
        permission: PERMISSIONS.MANAGE_PRODUCTS,
      },
      {
        title: " Tranfer History",
        url: "/admin/stock-transfer/history",
        icon: TriangleAlert,
        permission: PERMISSIONS.MANAGE_PRODUCTS,
      },
      {
        title: "Stock Reports",
        url: "/reports/stock-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
    ],
  },

  // ── Coupons & Offers (leaf) ────────────────────────────────────────────────
  {
    title: "Coupons & Offers",
    url: "/admin/coupons",
    icon: Tag,
    permission: PERMISSIONS.MANAGE_SALES,
  },
];

// ── Admin / ERP section ───────────────────────────────────────────────────────

const admin: NavGroup[] = [
  // ── Accounting ─────────────────────────────────────────────────────────────
  {
    title: "Accounting",
    url: "/admin/accounting/ledger",
    icon: BookOpen,
    permission: PERMISSIONS.VIEW_REPORTS,
    children: [
      {
        title: "Profit & Loss",
        url: "/reports/pnl-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        title: "Ledger",
        url: "/admin/accounting/ledger",
        icon: History,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        title: "Journal Entries",
        url: "/admin/accounting/journal",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        title: "Trial Balance",
        url: "/admin/accounting/trial-balance",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        title: "Balance Sheet",
        url: "/admin/accounting/balance-sheet",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        title: "GST / VAT Reports",
        url: "/admin/accounting/gst",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
    ],
  },

  // ── Expense Management ─────────────────────────────────────────────────────
  {
    title: "Expense Management",
    url: "/expenses",
    icon: Boxes,
    permission: PERMISSIONS.MANAGE_EXPENSES,
    children: [
      {
        title: "All Expenses",
        url: "/expenses",
        icon: List,
        permission: PERMISSIONS.MANAGE_EXPENSES,
      },
      {
        title: "Expense Categories",
        url: "/expensescategory",
        icon: FolderTree,
        permission: PERMISSIONS.MANAGE_EXPENSES,
      },
    ],
  },

  // ── Reports Engine ─────────────────────────────────────────────────────────
  {
    title: "Reports Engine",
    url: "/reports/sales-purchase-reports",
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_REPORTS,
    children: [
      {
        title: "Contact Report",
        url: "/reports/contact-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
        newTab: true,
      },
      {
        title:"sales Report",
        url: "/reports/sales-report",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.MANAGE_SALES,
        newTab: true,
      
      },
      {
        title: "Sales & Purchase Report",
        url: "/reports/sales-purchase-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
        newTab: true,
      },
      {
        title: "Payment Report",
        url: "/reports/payment-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
        newTab: true,
      },
      {
        title: "Profit & Loss Report",
        url: "/reports/pnl-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
        newTab: true,
      },
      {
        title: "Stock Report",
        url: "/reports/stock-reports",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
        newTab: true,
      },
      {
        title: "Daily Listing Summary",
        url: "/reports/daily-listing",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.VIEW_REPORTS,
        newTab: true,
      },
    ],
  },
{
  title: "Analytics",
  url: "/admin/analytics/customers",
  icon: BarChart3,
  permission: PERMISSIONS.VIEW_REPORTS,
  children: [
    { title: "Customer Analytics", url: "/admin/analytics/customers", icon: FileSpreadsheet, permission: PERMISSIONS.VIEW_REPORTS },
    { title: "Financial Analytics", url: "/admin/analytics/financial", icon: FileSpreadsheet, permission: PERMISSIONS.VIEW_REPORTS },
  ],
},
  // ── Master Management ──────────────────────────────────────────────────────
  {
    title: "Master Management",
    url: "/admin/branches",
    icon: Settings,
    children: [
      {
        title: "Branches",
        url: "/admin/branches",
        icon: Building2,
        permission: PERMISSIONS.MANAGE_BRANCHES,
      },
      {
        title: "Users & Staff",
        url: "/admin/users",
        icon: UserCheck,
        permission: PERMISSIONS.MANAGE_USERS,
      },
      {
        title: "Roles",
        url: "/roles",
        icon: Shield,
        permission: PERMISSIONS.MANAGE_ROLES,
      },
    ],
  },
  {
  title: "Audit Log",
  url: "/admin/audit",
  icon: Shield,
  permission: PERMISSIONS.MANAGE_ROLES,
},
];

// ── Secondary nav (footer, always visible) ────────────────────────────────────

export interface NavSecondaryItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const navSecondary: NavSecondaryItem[] = [
 
];

// ── Exports ───────────────────────────────────────────────────────────────────

export const SIDEBAR_DATA = {
  navMain,
  admin,
  navSecondary,
} as const;

export const COMPANY_INFO = {
  name: APP_CONFIG.name,
  description: APP_CONFIG.description,
} as const;