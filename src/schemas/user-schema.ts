// src/schemas/user-schema.ts
import { z } from 'zod';

// ── Login ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// ── Create user ────────────────────────────────────────────────────────────────

export const createUserSchema = z
  .object({
    name:            z.string().min(1, 'Name is required'),
    email:           z.string().email('Invalid email address'),
    phone:           z.string().optional(),
    password:        z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    roleId:          z.string().min(1, 'Role is required'),
    branchId:        z.string().min(1, 'Branch is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

export type CreateUserSchema = z.infer<typeof createUserSchema>;

// ── Update user ────────────────────────────────────────────────────────────────
// Passwords are not updated here — use a dedicated change-password endpoint.

export const updateUserSchema = z.object({
  id:       z.string().min(1, 'User ID is required'),
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email('Invalid email address'),
  phone:    z.string().optional(),
  roleId:   z.string().min(1, 'Role is required'),
  branchId: z.string().min(1, 'Branch is required'),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

// ── Delete / toggle (just needs an id) ────────────────────────────────────────

export const deleteUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export type DeleteUserSchema = z.infer<typeof deleteUserSchema>;

// ── Legacy alias — keeps any files still importing userFormSchema compiling ───
// Remove once all call sites are updated to createUserSchema.

export const userFormSchema = createUserSchema;
export type UserFormSchema = CreateUserSchema;