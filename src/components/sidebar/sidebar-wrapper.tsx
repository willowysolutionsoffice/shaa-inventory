// src/components/sidebar/sidebar-wrapper.tsx  ← new file
"use client";
import { usePermission } from "@/hooks/use-permission";
import { AppSidebar } from "./app-sidebar";

export function SidebarWrapper() {
  const { user } = usePermission();
  return <AppSidebar user={user} />;
}