// src/app/layout.tsx
// Root layout — RoleSwitcher removed (was dev-only mock).

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { APP_CONFIG } from "@/config/app";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";

const fontSans = DM_Sans({
  variable: "--font-sans",
  subsets:  ["latin"],
});

export const metadata: Metadata = {
  title:       APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <NextTopLoader color="#ea580c" showSpinner={false} />
          {children}
          <Toaster richColors position="top-right" />
          {/* RoleSwitcher removed — was mock dev tool only */}
        </ThemeProvider>
      </body>
    </html>
  );
}