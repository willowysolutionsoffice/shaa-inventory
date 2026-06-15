"use client";

// src/components/providers/session-provider.tsx
// Wraps the app with the real session context so usePermission() works everywhere.
// Used in the dashboard layout (server component passes session down as prop).

import { PermissionContext, type SessionUser } from "@/hooks/use-permission";
import { getPermissionsForRole, type Permission } from "@/constants/permissions";

export function SessionProvider({
  session,
  children,
}: {
  session: SessionUser | null;
  children: React.ReactNode;
}) {
  const user: SessionUser = session ?? {
    id:          '',
    email:       '',
    role:        'user',
    branchId:    '',
    permissions: [],
    name:        '',
  };

  const permissions = getPermissionsForRole(user.role) as Permission[];

  return (
    <PermissionContext.Provider
      value={{
        user,
        permissions,
        can:     (p) => permissions.includes(p),
        isAdmin: user.role === 'admin',
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}