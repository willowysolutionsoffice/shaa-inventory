// src/app/(dashboard)/layout.tsx
// Real layout — reads JWT session from cookie, redirects to /login if missing.
// Passes session into SessionProvider so usePermission() works in all children.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/common/site-header";
import { APP_CONFIG, theme } from "@/config/app";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title:       APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Not logged in → send to login
  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session.user}>
      <SidebarProvider
        style={{
          "--sidebar-width": theme.sidebarWidth,
          "--header-height": theme.headerHeight,
        } as React.CSSProperties}
        className="h-screen overflow-hidden"
      >
        <AppSidebar variant="floating" user={session.user} />
        <SidebarInset className="overflow-y-auto">
          <SiteHeader />
          <main className="p-4 md:p-6 bg-background min-h-[calc(100vh-1rem)]">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}