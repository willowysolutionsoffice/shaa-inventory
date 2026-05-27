"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavGroup } from "@/components/sidebar/nav-group";
import { NavUser } from "@/components/sidebar/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { SIDEBAR_DATA } from "@/constants/navigation";
import { UserProfile } from "@/types/user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserProfile;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [search, setSearch] = useState("");

  const filterItems = (items: any[]) => {
    if (!search) return items;

    return items
      .map((item) => {
        const titleMatch = item.title
          .toLowerCase()
          .includes(search.toLowerCase());

        if (titleMatch) return item;

        if (item.children) {
          const filteredChildren = item.children.filter((child: any) =>
            child.title.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren,
            };
          }
        }

        return null;
      })
      .filter(Boolean) as any[];
  };

  const filteredNavMain = filterItems(SIDEBAR_DATA.navMain);
  const filteredAdmin = filterItems(SIDEBAR_DATA.admin);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-slate-200/60 bg-white"
    >
      {/* HEADER */}
      <SidebarHeader className="bg-white px-4 pt-5 pb-4 border-b border-slate-100">
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center group-data-[collapsible=icon]:hidden">
          <img
            src="https://shaacalicut.com/cdn/shop/files/ChatGPT_Image_Jul_12_2025_11_44_52_PM.png?height=100&v=1752344140"
            alt="SHAA"
            className="h-16 w-auto object-contain"
          />

          <p className="text-[11px] tracking-[0.25em] text-slate-400 mt-1 uppercase">
            Enterprise Suite
          </p>
        </div>

        {/* COLLAPSED LOGO */}
        <img
          src="https://shaacalicut.com/cdn/shop/files/ChatGPT_Image_Jul_12_2025_11_44_52_PM.png?height=100&v=1752344140"
          alt="SHAA"
          className="h-8 w-8 object-contain hidden group-data-[collapsible=icon]:block mx-auto"
        />

        {/* SEARCH */}
        <div className="relative mt-5 group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

          <Input
            placeholder="Search menus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              h-11
              pl-10
              rounded-xl
              border-slate-200
              bg-slate-50
              text-sm
              shadow-none
              focus-visible:ring-2
              focus-visible:ring-blue-500/20
              focus-visible:border-blue-400
              transition-all
            "
          />
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent
        className="
          bg-gradient-to-b
          from-[#4F7DF3]
          to-[#3B66D9]
          text-white
          no-scrollbar
          py-4
        "
      >
        {/* MAIN NAV */}
        <div className="px-2">
          <NavMain items={filteredNavMain} />
        </div>

        {/* ADMIN */}
        {user?.role === "admin" && (
          <div className="mt-6">
            <div
              className="
                px-5
                mb-3
                text-[11px]
                font-medium
                uppercase
                tracking-[0.2em]
                text-white/60
              "
            >
              Admin & Operations
            </div>

            <div className="px-2">
              <NavGroup items={filteredAdmin} />
            </div>
          </div>
        )}

        {/* SECONDARY */}
        <div className="mt-auto px-2 pb-2">
          <NavGroup items={SIDEBAR_DATA.navSecondary} />
        </div>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter
        className="
          bg-[#3B66D9]
          border-t
          border-white/10
          text-white
          p-2
        "
      >
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}