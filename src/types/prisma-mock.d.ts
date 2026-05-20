// src/types/prisma-mock.d.ts

declare module '@prisma/client' {
  export interface User {
    id: string;
    email: string;
    name: string;
    role: string | null;
    branch: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export class PrismaClient {
    // Add minimal prisma dummy properties if needed
  }
}
