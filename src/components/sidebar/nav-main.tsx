// nav-main.tsx

"use client";

import { IconCirclePlusFilled } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import type { NavItem } from "@/types/navigation";
import { navigation } from "@/config/app";
import { NavMenu } from "./nav-menu";

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  return (
    <SidebarGroup className="p-0">
      <SidebarGroupContent className="flex flex-col gap-4">
        {navigation.showQuickCreate && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Quick Create"
                className="
                  h-11
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/15
                  text-white
                  shadow-lg
                  backdrop-blur-md
                  transition-all
                  duration-200
                  hover:bg-white/20
                  hover:scale-[1.01]
                  active:scale-[0.99]
                "
              >
                <IconCirclePlusFilled className="h-5 w-5" />
                <span className="font-medium tracking-wide">
                  Quick Create
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <NavMenu items={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}