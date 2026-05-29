"use client";

import { IconDotsVertical, IconLogout } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { UserProfile } from "@/types/navigation";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { LogoutDialog } from "../auth/logout-modal";

interface NavUserProps {
  user: UserProfile;
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const initials = getInitials(user.name);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="
                rounded-2xl border border-white/10
                bg-white/10 text-white
                backdrop-blur-md transition-all duration-200
                hover:bg-white/15
                /* collapsed: center the avatar, match icon row height */
                group-data-[collapsible=icon]:h-11
                group-data-[collapsible=icon]:w-full
                group-data-[collapsible=icon]:justify-center
                group-data-[collapsible=icon]:px-0
                /* expanded */
                group-data-[state=expanded]:h-14
                group-data-[state=expanded]:px-3
              "
            >
              <Avatar className="h-8 w-8 rounded-xl border border-white/10 shrink-0">
                <AvatarImage src={user.avatar ?? ""} alt={user.name} />
                <AvatarFallback className="rounded-xl bg-white/15 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Hidden when collapsed */}
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                <span className="truncate text-xs text-white/60">{user.email}</span>
              </div>

              <IconDotsVertical className="size-4 text-white/60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-60 rounded-2xl border-slate-200"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-500 cursor-pointer"
              onSelect={() => setOpenDelete(true)}
            >
              <IconLogout className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LogoutDialog open={openDelete} setOpen={setOpenDelete} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}