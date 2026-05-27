// nav-group.tsx

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
  className,
  ...props
}: NavGroupProps & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup className={className} {...props}>
      {label && (
        <SidebarGroupLabel
          className="
            px-4
            mb-2
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-white/55
          "
        >
          {label}
        </SidebarGroupLabel>
      )}

      <NavMenu items={items} />
    </SidebarGroup>
  );
}