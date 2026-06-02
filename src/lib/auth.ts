// src/lib/auth.ts
import { cookies } from "next/headers";

const MOCK_USERS: Record<string, { name: string; email: string }> = {
  admin:            { name: "Arjun Menon",        email: "arjun@shaacalicut.com"  },
  store_manager:    { name: "Faisal Ibrahim",      email: "faisal@shaacalicut.com" },
  purchase_manager: { name: "Suresh Nair",         email: "suresh@shaacalicut.com" },
  billing_staff:    { name: "Reshma Abdul Razak",  email: "reshma@shaacalicut.com" },
  accountant:       { name: "Priya Krishnan",      email: "priya@shaacalicut.com"  },
  user:             { name: "Demo Staff",           email: "staff@shaacalicut.com"  },
};

export const auth = {
  api: {
    getSession: async (options?: any) => {
      let role = "admin";

      if (process.env.NODE_ENV === "development") {
        const cookieStore = await cookies();
        role = cookieStore.get("shaa_mock_role")?.value ?? "admin";
      }

      const mockUser = MOCK_USERS[role] ?? MOCK_USERS.admin;

      return {
        user: {
          id: "mock-user",
          name: mockUser.name,
          email: mockUser.email,
          role,
          branch: "branch-calicut",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-id",
          userId: "mock-user",
          expiresAt: new Date(Date.now() + 86400000 * 30),
          token: "demo-token",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    },
  },
};