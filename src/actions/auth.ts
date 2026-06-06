// src/actions/auth.ts
'use server';

import { actionClient } from '@/lib/safeAction';
import { loginSchema, userFormSchema } from '@/schemas/user-schema';
import { z } from 'zod';
import { db } from '@/lib/mock-db';
// Mock Data Arrays
let mockUsers = [
  {
    id: 'admin-id',
    name: 'Demo Admin',
    email: 'admin@example.com',
    role: 'admin',
    branch: 'main-branch',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    branch: 'east-branch',
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    branch: 'west-branch',
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 86400000 * 10),
  },
];

const mockRoles = [
  {
    id: 'role-admin',
    value: 'admin',
    name: 'Admin',
    description: 'Full system administrative access',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'role-store-manager',
    value: 'store_manager',
    name: 'Store Manager',
    description: 'Manage store operations, products, and inventory',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'role-purchase-manager',
    value: 'purchase_manager',
    name: 'Purchase Manager',
    description: 'Handle purchase orders and suppliers',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'role-billing-staff',
    value: 'billing_staff',
    name: 'Billing Staff',
    description: 'Access to POS terminal and sales invoices',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'role-accountant',
    value: 'accountant',
    name: 'Accountant',
    description: 'Manage ledgers, journal entries, and financial statements',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockBranches = [
  {
    id: 'main-branch',
    name: 'Main Branch',
    phone: '123-456-7890',
    email: 'main@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'east-branch',
    name: 'East Coast Branch',
    phone: '123-456-7891',
    email: 'east@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'west-branch',
    name: 'West Coast Branch',
    phone: '123-456-7892',
    email: 'west@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Create user action
export const createUserAction = actionClient
  .inputSchema(userFormSchema)
  .action(async ({ parsedInput: { name, email, password, role, branch } }) => {
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: role || 'user',
      branch: branch || 'main-branch',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsers.push(newUser);

    return {
      success: true,
      message: 'User created successfully',
      user: newUser,
    };
  });

// Update user branch action
export const updateUserBranchAction = actionClient
  .inputSchema(
    z.object({
      userId: z.string(),
      branchId: z.string(),
    })
  )
  .action(async ({ parsedInput: { userId, branchId } }) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      user.branch = branchId;
      return {
        success: true,
        message: 'User branch updated successfully',
      };
    }
    return {
      success: false,
      message: 'Failed to update user branch. User not found.',
    };
  });

// Login action
export const loginAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    // Standard simulation: Allow any email ending with @example.com or any non-empty
    if (email && password) {
      return {
        success: true,
        message: 'Login successful',
        redirectTo: '/dashboard',
      };
    }
    return {
      success: false,
      message: 'Invalid email or password',
    };
  });

// Logout action
export const logoutAction = actionClient.action(async () => {
  console.log('Mock logoutAction: User logged out');
  return { success: true };
});

export const getAllUsers = async (skip?: number, take?: number) => {
  return {
    users: mockUsers,
    totalCount: mockUsers.length,
  };
};

export const getAllRoles = async () => {
  return mockRoles;
};

export const getAllBranches = async () => {
  return db.branches.map((b) => ({ id: b.id, name: b.name }));
};