import { cookies } from 'next/headers';
import { verifyAccessToken } from './jwt';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const auth = {
  api: {
    getSession: async () => {
      const cookieStore = await cookies();
      const token = cookieStore.get('access_token')?.value;

      // 1. If access_token exists, try verifying it
      if (token) {
        try {
          const payload = await verifyAccessToken(token);

          return {
            user: {
              id: payload.sub,
              email: payload.email,
              role: payload.role,
              branchId: payload.branchId,
              name: payload.name,
              permissions: payload.permissions,
            },
            session: {
              token,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          };
        } catch {
          // Token expired or invalid — proceed to auto-refresh below
        }
      }

      // 2. If access_token is missing or expired, attempt seamless server-side refresh using refresh_token
      const refreshToken = cookieStore.get('refresh_token')?.value;
      if (!refreshToken) return null;

      try {
        const res = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `refresh_token=${refreshToken}`,
          },
          cache: 'no-store',
        });

        if (!res.ok) return null;

        const rawSetCookie = res.headers.getSetCookie?.() ?? [];
        let newAccessToken: string | undefined;

        for (const cookie of rawSetCookie) {
          const [nameValue, ...parts] = cookie.split(';');
          const eqIndex = nameValue.indexOf('=');
          const name = nameValue.slice(0, eqIndex).trim();
          const value = nameValue.slice(eqIndex + 1).trim();

          if (name === 'access_token') newAccessToken = value;

          const maxAgeMatch = parts.find((p) => p.trim().toLowerCase().startsWith('max-age'));
          const maxAge = maxAgeMatch ? parseInt(maxAgeMatch.split('=')[1]) : undefined;

          cookieStore.set(name, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            ...(maxAge && { maxAge }),
          });
        }

        if (!newAccessToken) {
          newAccessToken = cookieStore.get('access_token')?.value;
        }

        if (!newAccessToken) return null;

        const payload = await verifyAccessToken(newAccessToken);
        return {
          user: {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            branchId: payload.branchId,
            name: payload.name,
            permissions: payload.permissions,
          },
          session: {
            token: newAccessToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        };
      } catch {
        return null;
      }
    },
  },
};
