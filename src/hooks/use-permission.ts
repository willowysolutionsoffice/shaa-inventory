"use client";

// src/hooks/use-permission.ts
// Real permission hook — reads from the session context passed down from the
// server layout. No more localStorage, no more mock roles.
// 
// Usage:
//   const { can, isAdmin, user } = usePermission();
//   if (can(PERMISSIONS.MANAGE_SALES)) { ... }

import { createContext, useContext } from "react";
import { getPermissionsForRole, type Permission } from "@/constants/permissions";

// ── Session context (set once in the client layout wrapper) ───────────────────

export interface SessionUser {
  id:          string;
  email:       string;
  role:        string;
  branchId:    string;
  permissions: string[];
  name?:       string;
}

export interface PermissionContextValue {
  user:        SessionUser;
  permissions: Permission[];
  can:         (permission: Permission) => boolean;
  isAdmin:     boolean;
}

export const PermissionContext = createContext<PermissionContextValue | null>(null);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePermission(): PermissionContextValue {
  const ctx = useContext(PermissionContext);

  if (!ctx) {
    throw new Error(
      'usePermission() must be used inside <SessionProvider>. ' +
      'Make sure your layout wraps children with <SessionProvider session={session}>.'
    );
  }

  return ctx;
}

// ── Provider helper (put this in src/components/providers/session-provider.tsx) ──
//
// "use client";
// import { PermissionContext, SessionUser } from "@/hooks/use-permission";
// import { getPermissionsForRole } from "@/constants/permissions";
//
// export function SessionProvider({
//   session,
//   children,
// }: {
//   session: SessionUser | null;
//   children: React.ReactNode;
// }) {
//   const user = session ?? {
//     id: "", email: "", role: "user", branchId: "", permissions: [],
//   };
//   const permissions = getPermissionsForRole(user.role);
//   return (
//     <PermissionContext.Provider value={{
//       user,
//       permissions,
//       can: (p) => permissions.includes(p),
//       isAdmin: user.role === "admin",
//     }}>
//       {children}
//     </PermissionContext.Provider>
//   );
// }