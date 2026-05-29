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
import { useSidebar } from "@/components/ui/sidebar";

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
              tooltip={item.title}
              isActive={pathname === item.url}
              className="
                group h-11 rounded-xl px-3
                text-[14px] font-medium
                text-white/85
                transition-all duration-200
                hover:bg-white/10 hover:text-white
                data-[active=true]:bg-white/15
                data-[active=true]:border data-[active=true]:border-white/10
                data-[active=true]:shadow-lg data-[active=true]:backdrop-blur-sm
                data-[active=true]:text-white
                group-data-[collapsible=icon]:justify-center
                group-data-[collapsible=icon]:px-0
              "
            >
              <Link
                href={item.url}
                className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center"
              >
                {item.icon && (
                  <item.icon className="h-5 w-5 shrink-0 text-white/75" />
                )}
                <span className="truncate transition-all duration-200 group-data-[collapsible=icon]:hidden">
                  {item.title}
                </span>
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive =
    pathname === item.url ||
    item.children?.some(
      (child) =>
        pathname === child.url ||
        child.children?.some((grandChild) => pathname === grandChild.url),
    );

  // ── COLLAPSED: hover-reveal floating panel ──────────────────────────
  if (isCollapsed) {
    return (
      <SidebarMenuItem className="group/submenu relative overflow-visible">
        {/* Icon-only trigger */}
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isActive}
          className="
            h-11 w-full rounded-xl px-0
            flex items-center justify-center
            text-white/85
            transition-all duration-200
            hover:bg-white/10 hover:text-white
            data-[active=true]:bg-white/15
            data-[active=true]:border data-[active=true]:border-white/10
            data-[active=true]:shadow-lg data-[active=true]:text-white
          "
        >
          {item.icon && (
            <item.icon className="h-5 w-5 shrink-0 text-white/75" />
          )}
        </SidebarMenuButton>

        {/* Floating popover on hover */}
        <div
          className="
            absolute left-full top-0 z-50
            ml-3 hidden
            group-hover/submenu:flex flex-col
            min-w-[180px] rounded-2xl
            border border-white/10 dark:border-slate-700
            bg-[#3B66D9]/95 dark:bg-slate-800/95
            backdrop-blur-xl shadow-2xl
            p-2 gap-1
          "
        >
          {/* Panel label */}
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">
            {item.title}
          </div>

          {item.children!.map((subItem) => (
            <Link
              key={subItem.url}
              href={subItem.url}
              className={`
                flex items-center gap-2.5
                h-9 px-3 rounded-xl
                text-[13px] font-medium
                transition-all duration-150
                ${
                  pathname === subItem.url
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
              <span>{subItem.title}</span>
            </Link>
          ))}
        </div>
      </SidebarMenuItem>
    );
  }

  // ── EXPANDED: normal collapsible ────────────────────────────────────
  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive}
            className="
              group h-11 rounded-xl px-3
              text-[14px] font-medium text-white/85
              transition-all duration-200
              hover:bg-white/10 hover:text-white
              data-[active=true]:bg-white/15
              data-[active=true]:border data-[active=true]:border-white/10
              data-[active=true]:shadow-lg data-[active=true]:backdrop-blur-sm
              data-[active=true]:text-white
            "
          >
            <div className="flex items-center gap-3 w-full">
              {item.icon && (
                <item.icon className="h-5 w-5 shrink-0 text-white/75 transition-colors group-hover:text-white" />
              )}
              <span className="truncate">{item.title}</span>
              <ChevronDown
                className="
                  ml-auto h-4 w-4 text-white/60
                  transition-transform duration-200
                  group-data-[state=open]/collapsible:rotate-180
                "
              />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-1">
          <SidebarMenuSub
            className="
              ml-4 border-l border-white/10
              pl-2 py-1 space-y-0.5
              [&>li]:list-none
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
                      h-9 rounded-lg px-3
                      text-[13px] text-white/70
                      transition-all duration-200
                      hover:bg-white/10 hover:text-white
                      data-[active=true]:bg-white/15 data-[active=true]:text-white
                    "
                  >
                    <Link href={subItem.url} className="flex items-center gap-2">
                      {subItem.icon && (
                        <subItem.icon className="h-4 w-4 shrink-0" />
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