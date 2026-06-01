// src/types/user.ts
// Unified user types for the mock-based system.
// These replace the @prisma/client User import used in users-table.tsx.

export interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  branch: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  value: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
  image?: string;
}

export interface UsersTableProps {
  users: User[];
  roles: Role[];
  branches: Branch[];
}