import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/common/site-header";
import { APP_CONFIG, theme } from "@/config/app";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": theme.sidebarWidth,
          "--header-height": theme.headerHeight,
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="floating" user={session?.user} />
      <SidebarInset>
        <SiteHeader />
        <main className="p-4 md:p-6 bg-background min-h-[calc(100vh-1rem)]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
