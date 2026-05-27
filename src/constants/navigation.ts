import {
  LayoutDashboard,
  Settings,
  Package,
  Warehouse,
  ShoppingBag,
  Receipt,
  Users,
  Tag,
  BookOpen,
  BarChart3,
  Building2,
  Mail,
  ShieldAlert,
  Settings2,
  HelpCircle,
  FolderTree,
  UserCheck,
  Percent,
  PlusCircle,
  List,
  Undo2,
  CreditCard,
  History,
  FileSpreadsheet,
  Boxes,
  BellRing
} from "lucide-react";
import type { SidebarData } from "@/types/navigation";
import { APP_CONFIG } from "@/config/app";

export const SIDEBAR_DATA: any = {
  // main navigation for all users
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Sales & Billing",
      url: "/sales",
      icon: Receipt,
      children: [
        {
          title: "POS Billing Terminal",
          url: "/sales/pos",
          icon: CreditCard,
        },
        {
          title: "List Sales",
          url: "/sales",
          icon: List,
        },
        {
          title: "Add Sale Order",
          url: "/sales/new",
          icon: PlusCircle,
        },
        {
          title: "Sales Returns",
          url: "/sales-return",
          icon: Undo2,
        },
      ],
    },
    {
      title: "Purchases",
      url: "/purchase",
      icon: ShoppingBag,
      children: [
        {
          title: "List Purchases",
          url: "/purchase",
          icon: List,
        },
        {
          title: "Add Purchase",
          url: "/purchase/new",
          icon: PlusCircle,
        },
        {
          title: "Purchase Returns",
          url: "/purchase-return",
          icon: Undo2,
        },
      ],
    },
    {
      title: "Customers & Contacts",
      url: "/admin/customers",
      icon: Users,
      children: [
        {
          title: "Customers",
          url: "/admin/customers",
          icon: UserCheck,
        },
        {
          title: "Suppliers",
          url: "/admin/supplier",
          icon: UserCheck,
        },
      ],
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: Package,
      children: [
        {
          title: "All Products",
          url: "/admin/products",
          icon: List,
        },
        {
          title: "Brands",
          url: "/admin/brands",
          icon: FolderTree,
        },
        {
          title: "Categories",
          url: "/admin/categories",
          icon: FolderTree,
        }
      ],
    },
    {
      title: "Inventory",
      url: "/admin/stock-adjustment",
      icon: Warehouse,
      children: [
        {
          title: "Stock Adjustments",
          url: "/admin/stock-adjustment",
          icon: PlusCircle,
        },
        {
          title: "Stock Reports",
          url: "/reports/stock-reports",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "Master Management",
      url: "/admin/branches",
      icon: Settings,
      children: [
        {
          title: "Branches",
          url: "/admin/branches",
          icon: Building2,
        },
        {
          title: "Users & Staff",
          url: "/admin/users",
          icon: UserCheck,
        },
      ],
    },
    {
      title: "Coupons & Offers",
      url: "/admin/coupons",
      icon: Tag,
    },
  ],

  // Admin and ERP operations side
  admin: [
    {
      title: "Accounting",
      url: "/admin/accounting/ledger",
      icon: BookOpen,
      children: [
        {
          title: "Profit & Loss",
          url: "/reports/pnl-reports",
          icon: FileSpreadsheet,
        },
        {
          title: "Ledger",
          url: "/admin/accounting/ledger",
          icon: History,
        },
        {
          title: "Journal Entries",
          url: "/admin/accounting/journal",
          icon: FileSpreadsheet,
        },
        {
          title: "Trial Balance",
          url: "/admin/accounting/trial-balance",
          icon: FileSpreadsheet,
        },
        {
          title: "Balance Sheet",
          url: "/admin/accounting/balance-sheet",
          icon: FileSpreadsheet,
        },
        {
          title: "GST / VAT Reports",
          url: "/admin/accounting/gst",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "Expense Management",
      url: "/expenses",
      icon: Boxes,
      children: [
        {
          title: "All Expenses",
          url: "/expenses",
          icon: List,
        },
        {
          title: "Expense Categories",
          url: "/expensescategory",
          icon: FolderTree,
        },
      ],
    },
    {
      title: "Reports Engine",
      url: "/reports/sales-purchase-reports",
      icon: BarChart3,
      children: [
        {
          title: "Contact Report",
          url: "/reports/contact-reports",
        },
        {
          title: "Sales & Purchase Report",
          url: "/reports/sales-purchase-reports",
        },
        {
          title: "Payment Report",
          url: "/reports/payment-reports",
        },
        {
          title: "Profit & Loss Report",
          url: "/reports/pnl-reports",
        },
        {
          title: "Stock Report",
          url: "/reports/stock-reports",
        },
        {
          title: "Daily Listing Summary",
          url: "/reports/daily-listing",
        },
      ],
    },

  ],

  // secondary navigation for footer
  navSecondary: [],
};

export const COMPANY_INFO = {
  name: APP_CONFIG.name,
  description: APP_CONFIG.description,
} as const;
