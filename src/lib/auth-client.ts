// src/lib/auth-client.ts
// Mock auth-client implementation for frontend-only build

export const authClient = {
  admin: {
    removeUser: async (args: { userId: string }) => {
      console.log('Mock removeUser:', args);
      return { success: true, message: 'User removed successfully' };
    },
    setRole: async (args: { userId: string; role: 'admin' | 'user' }) => {
      console.log('Mock setRole:', args);
      return { success: true, message: 'Role updated successfully' };
    },
  },
  getSession: async () => {
    return {
      data: {
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
      },
    };
  },
};
