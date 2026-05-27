// nav-user.tsx

"use client";

import {
  IconDotsVertical,
  IconLogout,
} from "@tabler/icons-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

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
  const { isMobile } = useSidebar();

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
                h-14
                rounded-2xl
                border
                border-white/10
                bg-white/10
                px-3
                text-white
                backdrop-blur-md
                transition-all
                duration-200
                hover:bg-white/15
              "
            >
              <Avatar className="h-10 w-10 rounded-xl border border-white/10">
                <AvatarImage
                  src={user.name.charAt(0)}
                  alt={user.name}
                />

                <AvatarFallback className="rounded-xl bg-white/15 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  {user.name}
                </span>

                <span className="truncate text-xs text-white/60">
                  {user.email}
                </span>
              </div>

              <IconDotsVertical className="size-4 text-white/60" />
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
                  <p className="text-sm font-semibold">
                    {user.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-500 cursor-pointer"
              onSelect={() => setOpenDelete(!openDelete)}
            >
              <IconLogout className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LogoutDialog
          open={openDelete}
          setOpen={setOpenDelete}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}