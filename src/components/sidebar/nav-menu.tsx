// nav-menu.tsx

"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { NavItem } from "@/types/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavMenuProps {
  items: NavItem[];
}

export const NavMenu = ({ items, ...rest }: NavMenuProps) => {
  const pathname = usePathname();

  return (
    <SidebarMenu className="space-y-1.5" {...rest}>
      {items.map((item) =>
        item.children ? (
          <SubMenu key={item.title} item={item} />
        ) : (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.url}
              className="
                group
                h-11
                rounded-xl
                px-3
                text-[14px]
                font-medium
                text-white/85
                transition-all
                duration-200
                hover:bg-white/10
                hover:text-white
                data-[active=true]:bg-white/15
                data-[active=true]:border
                data-[active=true]:border-white/10
                data-[active=true]:shadow-lg
                data-[active=true]:backdrop-blur-sm
                data-[active=true]:text-white
              "
            >
              <Link
                href={item.url}
                className="flex items-center gap-3 w-full"
              >
                {item.icon && (
                  <item.icon className="h-4 w-4 text-white/75 group-hover:text-white transition-colors" />
                )}

                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  );
};

const SubMenu = ({ item }: { item: NavItem }) => {
  const pathname = usePathname();

  const isActive =
    pathname === item.url ||
    item.children?.some(
      (child) =>
        pathname === child.url ||
        (child.children &&
          child.children.some(
            (grandChild) => pathname === grandChild.url,
          )),
    );

  return (
    <Collapsible
      defaultOpen={isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            className="
              group
              h-11
              rounded-xl
              px-3
              text-[14px]
              font-medium
              text-white/85
              transition-all
              duration-200
              hover:bg-white/10
              hover:text-white
              data-[active=true]:bg-white/15
              data-[active=true]:border
              data-[active=true]:border-white/10
              data-[active=true]:shadow-lg
              data-[active=true]:backdrop-blur-sm
              data-[active=true]:text-white
            "
          >
            <div className="flex items-center gap-3 w-full">
              {item.icon && (
                <item.icon className="h-4 w-4 text-white/75 group-hover:text-white transition-colors" />
              )}

              <span className="truncate">{item.title}</span>

              <ChevronDown
                className="
                  ml-auto
                  h-4
                  w-4
                  text-white/60
                  transition-transform
                  duration-200
                  group-data-[state=open]/collapsible:rotate-180
                "
              />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-1">
          <SidebarMenuSub
            className="
              ml-5
              border-l
              border-white/10
              pl-3
              space-y-1
            "
          >
            {item.children!.map((subItem) =>
              subItem.children ? (
                <SidebarMenuSubItem key={subItem.url}>
                  <SubMenu item={subItem} />
                </SidebarMenuSubItem>
              ) : (
                <SidebarMenuSubItem key={subItem.url}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.url}
                    className="
                      h-9
                      rounded-lg
                      px-3
                      text-[13px]
                      text-white/70
                      transition-all
                      duration-200
                      hover:bg-white/10
                      hover:text-white
                      data-[active=true]:bg-white/12
                      data-[active=true]:text-white
                    "
                  >
                    <Link
                      href={subItem.url}
                      className="flex items-center gap-2"
                    >
                      {subItem.icon && (
                        <subItem.icon className="h-3.5 w-3.5" />
                      )}

                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ),
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};