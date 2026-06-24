"use client";

/**
 * providers/session-provider.tsx
 *
 * Two providers, composed here so the app only needs one import:
 *
 *  TokenRefreshProvider  — silently refreshes the access token before it
 *                          expires (polls every 12 min, retries on focus /
 *                          network reconnect, never redirects on failure).
 *
 *  SessionProvider       — resolves the current user + permissions and
 *                          makes usePermission() / can() / isAdmin work
 *                          everywhere below.
 *
 * Usage (dashboard layout):
 *   <SessionProvider session={session}>
 *     {children}
 *   </SessionProvider>
 *
 * Usage (401 recovery in any component):
 *   const { refresh } = useSession();
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";

import { PermissionContext, type SessionUser } from "@/hooks/use-permission";
import { getPermissionsForRole, type Permission } from "@/constants/permissions";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Must be less than the access-token TTL (15 min → refresh every 12 min). */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

// ---------------------------------------------------------------------------
// TokenRefreshContext
// ---------------------------------------------------------------------------

interface TokenRefreshContextValue {
  /** Force an immediate silent refresh — call this after a 401. */
  refresh: () => Promise<boolean>;
}

const TokenRefreshContext = createContext<TokenRefreshContextValue>({
  refresh: async () => false,
});

/** Access the token-refresh function from any component. */
export function useSession() {
  return useContext(TokenRefreshContext);
}

// ---------------------------------------------------------------------------
// TokenRefreshProvider  (internal — composed inside SessionProvider)
// ---------------------------------------------------------------------------

function TokenRefreshProvider({ children }: { children: ReactNode }) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  const refresh = useCallback(async (): Promise<boolean> => {
    // Deduplicate concurrent calls
    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        inFlightRef.current = null;
      });

    return inFlightRef.current;
  }, []);

  useEffect(() => {
    // Refresh immediately so the token is fresh right away
    refresh();

    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);

    // Refresh on window focus (handles laptop sleep / screen lock)
    window.addEventListener("focus", refresh);

    // Refresh when the network comes back online
    window.addEventListener("online", refresh);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [refresh]);

  return (
    <TokenRefreshContext.Provider value={{ refresh }}>
      {children}
    </TokenRefreshContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SessionProvider  (public — use this in your layout)
// ---------------------------------------------------------------------------

interface SessionProviderProps {
  session: SessionUser | null;
  children: ReactNode;
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  const user: SessionUser = session ?? {
    id: "",
    email: "",
    role: "user",
    branchId: "",
    permissions: [],
    name: "",
  };

  const permissions = getPermissionsForRole(user.role) as Permission[];

  return (
    <TokenRefreshProvider>
      <PermissionContext.Provider
        value={{
          user,
          permissions,
          can: (p) => permissions.includes(p),
          isAdmin: user.role === "admin",
        }}
      >
        {children}
      </PermissionContext.Provider>
    </TokenRefreshProvider>
  );
}