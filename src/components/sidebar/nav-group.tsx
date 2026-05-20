"use client";

import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

import type { NavItem } from "@/types/navigation";
import { NavMenu } from "./nav-menu";

interface NavGroupProps {
  label?: string;
  items: NavItem[];
}

export function NavGroup({
  label,
  items,
  ...props
}: NavGroupProps & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel className="text-white">{label}</SidebarGroupLabel>
      <NavMenu items={items} />
    </SidebarGroup>
  );
}
