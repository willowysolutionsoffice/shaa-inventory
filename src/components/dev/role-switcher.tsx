"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMockRole, getMockSession } from "@/hooks/use-permission";
import { getPermissionsForRole } from "@/constants/permissions";
import { FlaskConical, X } from "lucide-react";

const ROLES = [
  { value: "admin",            label: "Admin",            color: "bg-purple-500", desc: "All permissions" },
  { value: "store_manager",    label: "Store Manager",    color: "bg-blue-500",   desc: "Sales, products, expenses" },
  { value: "purchase_manager", label: "Purchase Manager", color: "bg-teal-500",   desc: "Purchases, suppliers, products" },
  { value: "billing_staff",    label: "Billing Staff",    color: "bg-orange-500", desc: "POS, sales, customers" },
  { value: "accountant",       label: "Accountant",       color: "bg-green-500",  desc: "Reports, expenses, finance" },
  { value: "user",             label: "Basic User",       color: "bg-gray-500",   desc: "Dashboard + sales only" },
];

export function RoleSwitcher() {
  const router = useRouter();
  const [current, setCurrent] = useState(getMockSession().role);
  const [minimized, setMinimized] = useState(false);

  const activeRole = ROLES.find((r) => r.value === current) ?? ROLES[0];
  const permCount = getPermissionsForRole(current).length;

  const switchTo = (roleValue: string) => {
    setMockRole(roleValue);
    setCurrent(roleValue);
    router.refresh();
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[99999] flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs px-3 py-2 shadow-xl border border-white/10 hover:bg-slate-800 transition-colors"
      >
        <FlaskConical className="h-3.5 w-3.5 text-yellow-400" />
        <span className={`h-2 w-2 rounded-full ${activeRole.color}`} />
        {activeRole.label}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[99999] w-72 rounded-xl bg-slate-900 text-white shadow-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Dev · Role Switcher</span>
        </div>
        <button onClick={() => setMinimized(true)} className="text-white/40 hover:text-white/80 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Current role display */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Viewing as</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${activeRole.color}`} />
            <span className="text-sm font-semibold">{activeRole.label}</span>
          </div>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
            {permCount} permissions
          </span>
        </div>
        <p className="text-[11px] text-white/40 mt-1">{getMockSession().name} · {getMockSession().email}</p>
      </div>

      {/* Role list */}
      <div className="p-2 space-y-1">
        {ROLES.map((role) => {
          const isActive = role.value === current;
          const perms = getPermissionsForRole(role.value).length;
          return (
            <button
              key={role.value}
              onClick={() => switchTo(role.value)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? "bg-white/15 ring-1 ring-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${role.color}`} />
                <div>
                  <p className="text-sm font-medium leading-none">{role.label}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{role.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">{perms}p</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-[10px] text-white/25 text-center">Remove this component before production</p>
      </div>
    </div>
  );
}