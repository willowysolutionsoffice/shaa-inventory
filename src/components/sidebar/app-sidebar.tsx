"use client";

import Link from "next/link";
import { IconInnerShadowTop } from "@tabler/icons-react";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SIDEBAR_DATA, COMPANY_INFO } from "@/constants/navigation";
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
        const titleMatch = item.title.toLowerCase().includes(search.toLowerCase());
        if (titleMatch) {
          return item;
        }
        if (item.children) {
          const filteredChildren = item.children.filter((child: any) =>
            child.title.toLowerCase().includes(search.toLowerCase())
          );
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
        }
        return null;
      })
      .filter(Boolean) as any[];
  };

  const filteredNavMain = filterItems(SIDEBAR_DATA.navMain);
  const filteredAdmin = filterItems(SIDEBAR_DATA.admin);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="bg-secondary text-secondary-foreground border-b border-border/50 py-3 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-6 text-purple-500 animate-pulse" />
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {COMPANY_INFO.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Dynamic Sidebar Search */}
        <div className="relative mt-2 px-1 group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search menus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-purple-500/50"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-primary text-primary-foreground no-scrollbar py-2">
        <NavMain items={filteredNavMain} />
        {user?.role === "admin" && (
          <NavGroup label="Admin & Operations" items={filteredAdmin} />
        )}
        <NavGroup items={SIDEBAR_DATA.navSecondary} className="mt-auto" />
      </SidebarContent>
      
      <SidebarFooter className="bg-sidebar-primary text-primary-foreground border-t border-border/50">
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
