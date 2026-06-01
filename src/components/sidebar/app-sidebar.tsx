// src/components/sidebar/app-sidebar.tsx
// Drop-in replacement. Now filters nav items based on user role permissions.

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavGroup } from "@/components/sidebar/nav-group";
import { NavUser } from "@/components/sidebar/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import { SIDEBAR_DATA, NavItem } from "@/constants/navigation";
import { getPermissionsForRole } from "@/constants/permissions";
import type { Permission } from "@/constants/permissions";
import { UserProfile } from "@/types/user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserProfile;
}

/** Filter nav items: include item if it has no permission requirement,
 *  OR if the current user's role grants that permission. */
function filterByPermission(items: NavItem[], userPermissions: Permission[]): NavItem[] {
  return items.filter(
    (item) => !item.permission || userPermissions.includes(item.permission)
  );
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();

  // Derive permissions from the user's role (sync, no async needed)
  const userPermissions = user?.role
    ? getPermissionsForRole(user.role)
    : [];

  const isAdmin = user?.role === "admin";

  const visibleNavMain   = filterByPermission(SIDEBAR_DATA.navMain, userPermissions);
  const visibleAdmin     = filterByPermission(SIDEBAR_DATA.admin, userPermissions);
  const visibleSecondary = filterByPermission(SIDEBAR_DATA.navSecondary, userPermissions);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="
        relative border-r
        border-slate-200/60 dark:border-slate-800
        bg-white dark:bg-slate-900
        transition-all duration-300 ease-in-out
      "
    >
      {/* COLLAPSE BUTTON */}
      <div className="absolute top-1/2 -right-3 z-50 hidden md:flex -translate-y-1/2">
        <button
          onClick={toggleSidebar}
          className="
            flex h-7 w-7 items-center justify-center
            rounded-full border
            border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800
            shadow-lg transition-all duration-200
            hover:scale-105
            hover:bg-slate-50 dark:hover:bg-slate-700
          "
        >
          {state === "expanded" ? (
            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* HEADER */}
      <SidebarHeader
        className="
          bg-white dark:bg-slate-900
          border-b border-slate-100 dark:border-slate-800
          px-3 py-4 shrink-0
          transition-all duration-300
        "
      >
        <div className="flex items-center justify-center transition-all duration-300 group-data-[collapsible=icon]:hidden">
          <img
            src="https://shaacalicut.com/cdn/shop/files/ChatGPT_Image_Jul_12_2025_11_44_52_PM.png?height=100&v=1752344140"
            alt="SHAA"
            className="h-14 w-auto object-contain"
          />
        </div>
        <div className="hidden items-center justify-center transition-all duration-300 group-data-[collapsible=icon]:flex">
          <img
            src="https://shaacalicut.com/cdn/shop/files/ChatGPT_Image_Jul_12_2025_11_44_52_PM.png?height=100&v=1752344140"
            alt="SHAA"
            className="h-8 w-8 object-contain"
          />
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent
        className="
          flex flex-col min-h-0
          bg-gradient-to-b
          from-[#4F7DF3] via-[#4672E8] to-[#3B66D9]
          dark:from-slate-900 dark:via-slate-900 dark:to-slate-900
          text-white overflow-y-auto overflow-x-hidden
          no-scrollbar py-4
        "
      >
        {/* MAIN NAV — filtered by permission */}
        <div className="px-2 shrink-0">
          <NavMain items={visibleNavMain} />
        </div>

        {/* ADMIN SECTION — only shown if user has at least one admin permission */}
        {isAdmin && visibleAdmin.length > 0 && (
          <div className="mt-4 shrink-0 group-data-[collapsible=icon]:hidden">
            <div className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Admin & Operations
            </div>
            <div className="px-2">
              <NavGroup items={visibleAdmin} />
            </div>
          </div>
        )}

        {/* Non-admin users who have some admin permissions (e.g. manage_branches for manager) */}
        {!isAdmin && visibleAdmin.length > 0 && (
          <div className="mt-4 shrink-0 group-data-[collapsible=icon]:hidden">
            <div className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Management
            </div>
            <div className="px-2">
              <NavGroup items={visibleAdmin} />
            </div>
          </div>
        )}

        {/* SECONDARY — pinned to bottom */}
        <div className="mt-auto px-2 pb-2 shrink-0">
          <NavGroup items={visibleSecondary} />
        </div>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter
        className="
          bg-[#3B66D9] dark:bg-slate-900
          border-t border-white/10 dark:border-slate-800
          text-white p-2 shrink-0
          transition-all duration-300
        "
      >
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}