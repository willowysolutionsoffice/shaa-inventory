// src/lib/auth.ts
// Mock auth implementation for frontend-only build

export const auth = {
  api: {
    getSession: async (options?: any) => {
      return {
        user: {
          id: 'admin-id',
          name: 'Demo Admin',
          email: 'admin@example.com',
          role: 'admin',
          branch: 'main-branch',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-id',
          userId: 'admin-id',
          expiresAt: new Date(Date.now() + 86400000 * 30),
          token: 'demo-token',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    },
  },
};
