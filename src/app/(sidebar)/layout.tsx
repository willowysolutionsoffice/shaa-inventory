import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/common/site-header";
import { APP_CONFIG, theme } from "@/config/app";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";

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
    const cookieStore = await cookies();
  const mockRole = process.env.NODE_ENV === "development"
    ? cookieStore.get("shaa_mock_role")?.value
    : undefined;
     const MOCK_NAMES: Record<string, string> = {
    admin:            "Arjun Menon",
    store_manager:    "Faisal Ibrahim",
    purchase_manager: "Suresh Nair",
    billing_staff:    "Reshma Abdul Razak",
    accountant:       "Priya Krishnan",
    user:             "Demo Staff",
  };
   const effectiveUser = mockRole
    ? {
        ...session?.user,
        role: mockRole,
        name: MOCK_NAMES[mockRole] ?? session?.user?.name,
      }
    : session?.user;
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": theme.sidebarWidth,
          "--header-height": theme.headerHeight,
        } as React.CSSProperties
      }
            className="h-screen overflow-hidden"  // ← add this

    >
      <AppSidebar variant="floating" user={session?.user} />
      <SidebarInset className="overflow-y-auto">  {/* ← add overflow-y-auto */}
        <SiteHeader />
        <main className="p-4 md:p-6 bg-background min-h-[calc(100vh-1rem)]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
