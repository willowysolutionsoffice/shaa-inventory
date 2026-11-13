import { cookies } from 'next/headers';
import { verifyAccessToken } from './jwt';

export const auth = {
  api: {
    getSession: async () => {
      const cookieStore = await cookies();
      const token = cookieStore.get('access_token')?.value;
      try {
        if (!token) return null;
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
        return null;
      }
    },
  },
};
