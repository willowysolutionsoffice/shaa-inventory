import { cookies } from 'next/headers';
import { verifyAccessToken } from './jwt';  // ← your new jose version

export const auth = {
  api: {
    getSession: async () => {
      const cookieStore = await cookies();
      const token = cookieStore.get('access_token')?.value;

      if (!token) return null;

      try {
        const payload = await verifyAccessToken(token); // ← add await

        return {
          user: {
            id:          payload.sub,
            email:       payload.email,
            role:        payload.role,
            branchId:    payload.branchId,
                name:        payload.name,   // ← add this

            permissions: payload.permissions,
          },
          session: {
            token,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        };
      } catch {
        return null;
      }
    },
  },
};