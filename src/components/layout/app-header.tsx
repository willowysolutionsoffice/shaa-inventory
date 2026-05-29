// components/layout/app-header.tsx

"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header
      className="
        sticky
        top-0
        z-40
        flex
        h-16
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white/80
        px-6
        backdrop-blur-xl
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <SidebarTrigger
          className="
            h-10
            w-10
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-sm
            transition-all
            duration-200
            hover:bg-slate-50
            hover:shadow-md
          "
        />

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Dashboard
          </h1>

          <p className="text-xs text-slate-500">
            Welcome back
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <div
          className="
            hidden
            md:flex
            h-10
            items-center
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            text-sm
            text-slate-500
          "
        >
          SHAA ERP
        </div>
      </div>
    </header>
  );
}