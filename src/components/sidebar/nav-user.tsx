"use client";

import { IconDotsVertical, IconLogout, IconSettings, IconDatabase } from "@tabler/icons-react";
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
import { useRouter } from "next/navigation";
import { LogoutDialog } from "../auth/logout-modal";
import { BackupDialog } from "../backup/backup-dialog";

interface NavUserProps {
  user: UserProfile;
}

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const initials = getInitials(user.name);
  const [openDelete, setOpenDelete] = useState(false);
  const [openBackup, setOpenBackup] = useState(false);

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
            className="w-60 rounded-2xl border-slate-200/80 shadow-xl bg-white dark:bg-slate-900 dark:border-slate-800 p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-800">
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            <DropdownMenuItem
              className="cursor-pointer font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-2 text-sm"
              onSelect={() => router.push("/admin/settings/system")}
            >
              <IconSettings className="mr-2.5 h-4 w-4 text-slate-500" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-2 text-sm"
              onSelect={() => setOpenBackup(true)}
            >
              <IconDatabase className="mr-2.5 h-4 w-4 text-[#4F7DF3]" />
              Backup Data
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            <DropdownMenuItem
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer font-medium rounded-xl px-3 py-2 text-sm"
              onSelect={() => setOpenDelete(true)}
            >
              <IconLogout className="mr-2.5 h-4 w-4 text-red-500" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <BackupDialog open={openBackup} setOpen={setOpenBackup} />
        <LogoutDialog open={openDelete} setOpen={setOpenDelete} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
