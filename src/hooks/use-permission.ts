// src/hooks/use-permission.ts
// Mock session store — drives the RoleSwitcher, dashboard, and sidebar.
// In production, replace getMockSession() with your real auth session.

"use client";

import { useState, useEffect } from "react";
import { getPermissionsForRole, type Permission } from "@/constants/permissions";

// ── Mock session store (localStorage-backed) ──────────────────────────────────

const STORAGE_KEY = "shaa_mock_role";

const MOCK_USERS: Record<string, { name: string; email: string }> = {
  admin:            { name: "Arjun Menon",       email: "arjun@shaacalicut.com"    },
  store_manager:    { name: "Faisal Ibrahim",     email: "faisal@shaacalicut.com"   },
  purchase_manager: { name: "Suresh Nair",        email: "suresh@shaacalicut.com"   },
  billing_staff:    { name: "Reshma Abdul Razak", email: "reshma@shaacalicut.com"   },
  accountant:       { name: "Priya Krishnan",     email: "priya@shaacalicut.com"    },
  user:             { name: "Demo Staff",          email: "staff@shaacalicut.com"    },
};

export interface MockSession {
  role: string;
  name: string;
  email: string;
}

/** Read the current mock session (safe to call outside React). */
export function getMockSession(): MockSession {
  if (typeof window === "undefined") {
    // SSR fallback
    return { role: "admin", ...MOCK_USERS.admin };
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  const role = stored ?? "admin";
  return { role, ...(MOCK_USERS[role] ?? MOCK_USERS.admin) };
}

/** Set a new role and trigger a storage event so all tabs/hooks update. */
export function setMockRole(role: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, role);
  // Write cookie so server components can read it
  document.cookie = `shaa_mock_role=${role}; path=/; max-age=86400`;
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: role }));
}

// ── React hook ────────────────────────────────────────────────────────────────

export interface UsePermissionReturn {
  user: MockSession;
  permissions: Permission[];
  can: (permission: Permission) => boolean;
  isAdmin: boolean;
}

/**
 * Reactive hook — re-renders whenever setMockRole() is called.
 * Use this in any client component (dashboard, sidebar, etc.)
 */
export function usePermission(): UsePermissionReturn {
  const [session, setSession] = useState<MockSession>(getMockSession);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSession(getMockSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const permissions = getPermissionsForRole(session.role);

  return {
    user: session,
    permissions,
    can: (permission: Permission) => permissions.includes(permission),
    isAdmin: session.role === "admin",
  };
}