import {
  IconAddressBook,
  IconBox,
  IconBrandShopee,
  IconBuilding,
  IconCategory,
  IconCoin,
  IconCurrency,
  IconDashboard,
  IconFileText,
  IconPercentage,
  IconShoppingBag,
  IconUserPlus,
} from "@tabler/icons-react";
import type { SidebarData } from "@/types/navigation";
import { APP_CONFIG } from "@/config/app";

export const SIDEBAR_DATA: SidebarData = {
  // main navigation for all users
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Purchase",
      url: "/purchase",
      icon: IconShoppingBag,
      children: [
        {
          title: "List Purchases",
          url: "/purchase",
        },
        {
          title: "Add Purchase",
          url: "/purchase/new",
        },
        {
          title: "Purchase Return",
          url: "/purchase-return",
        },
      ],
    },
    {
      title: "Sales",
      url: "/sales",
      icon: IconCoin,
      children: [
        {
          title: "List Sales",
          url: "/sales",
        },
        {
          title: "Add Sale",
          url: "/sales/new",
        },
        {
          title: "Sales Return",
          url: "/sales-return",
        },
      ],
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: IconCurrency,
      children: [
        {
          title: "Expenses",
          url: "/expenses",
        },
        {
          title: "Expenses Category",
          url: "/expensescategory",
        },
      ],
    },
  ],

  // only admin can see this navigation
  admin: [
    // {
    //   title: 'Data Management',
    //   url: '/admin/data-management',
    //   icon: IconDatabase,
    // },
    {
      title: "Products",
      url: "/admin/products",
      icon: IconBox,
      children: [
        {
          title: "All Products",
          url: "/admin/products",
        },
        {
          title: "Stock Adjustment",
          url: "/admin/stock-adjustment",
        },
      ],
    },
    {
      title: "Brands",
      url: "/admin/brands",
      icon: IconBrandShopee,
    },

    {
      title: "Contacts",
      url: "/admin/contacts",
      icon: IconAddressBook,
      children: [
        {
          title: "Customers",
          url: "/admin/customers",
        },
        {
          title: "Suppliers",
          url: "/admin/supplier",
        },
      ],
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: IconFileText,
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
          title: "Daily Listing",
          url: "/reports/daily-listing",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUserPlus,
    },

    {
      title: "Branches",
      url: "/admin/branches",
      icon: IconBuilding,
    },
  ],

  // secondary navigation for all users
  navSecondary: [],
};

export const COMPANY_INFO = {
  name: APP_CONFIG.name,
  description: APP_CONFIG.description,
} as const;
