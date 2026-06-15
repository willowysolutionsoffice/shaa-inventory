// src/components/user-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import { createUserSchema, updateUserSchema } from '@/schemas/user-schema';
import { createUser, updateUser } from '@/actions/user-action';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ErrorMessage } from '@/components/ui/error-message';

// ── Prop types ────────────────────────────────────────────────────────────────

interface RoleOption {
  id:           string;
  name:         string;
  description?: string;
}

interface BranchOption {
  id:       string;
  name:     string;
  address?: string;
}

interface UserFormProps {
  roles:        RoleOption[];
  branches:     BranchOption[];
  onSuccess?:   () => void;
  isEdit?:      boolean;
  // For edit mode — pass the user's current IDs so selects pre-populate
  initialData?: {
    id:       string;
    name:     string;
    email:    string;
    phone?:   string;
    roleId:   string;   // UUID — used as the select value
    branchId: string;   // UUID — used as the select value
  };
}

// ── Form field shapes ─────────────────────────────────────────────────────────

type CreateFields = {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
  roleId:          string;
  branchId:        string;
  phone?:          string;
};

type EditFields = {
    id:       string;   // ← add this

  name:     string;
  email:    string;
  roleId:   string;
  branchId: string;
  phone?:   string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function UserForm({ roles, branches, onSuccess, initialData, isEdit }: UserFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // ── Create form ─────────────────────────────────────────────────────────────
  const createForm = useForm<CreateFields>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {

      name:            '',
      email:           '',
      password:        '',
      confirmPassword: '',
      roleId:          '',
      branchId:        '',
      phone:           '',
    },
  });

  // ── Edit form ───────────────────────────────────────────────────────────────
  const editForm = useForm<EditFields>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
          id:       initialData?.id       ?? '',   // ← add this

      name:     initialData?.name     ?? '',
      email:    initialData?.email    ?? '',
      roleId:   initialData?.roleId   ?? '',
      branchId: initialData?.branchId ?? '',
      phone:    initialData?.phone    ?? '',
    },
  });

  // Re-populate edit form when initialData changes (drawer re-opens for a
  // different user without unmounting).
  useEffect(() => {
    if (isEdit && initialData) {
      editForm.reset({
              id:       initialData.id       ?? '',  // ← ADD THIS

        name:     initialData.name     ?? '',
        email:    initialData.email    ?? '',
        roleId:   initialData.roleId   ?? '',
        branchId: initialData.branchId ?? '',
        phone:    initialData.phone    ?? '',
      });
    }
  }, [initialData, isEdit, editForm]);

  // ── Create action ───────────────────────────────────────────────────────────
  const { execute: execCreate, isExecuting: creating } = useAction(createUser, {
    onSuccess: ({ data }) => {
      // actionClient wraps our return; a successful user sits at data directly.
      // An error from the server sits at data.error.
      if ((data as any)?.error) {
        setFormError((data as any).error);
        return;
      }
      toast.success('User created successfully');
      createForm.reset();
      setFormError(null);
      onSuccess?.();
    },
    onError: ({ error }) => {
      console.error('Create user error:', error);
      setFormError('An unexpected error occurred. Please try again.');
    },
  });

  // ── Update action ───────────────────────────────────────────────────────────
  const { execute: execUpdate, isExecuting: updating } = useAction(updateUser, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) {
        setFormError((data as any).error);
        return;
      }
      toast.success('User updated successfully');
      setFormError(null);
      onSuccess?.();
    },
    onError: ({ error }) => {
      console.error('Update user error:', error);
      setFormError('An unexpected error occurred. Please try again.');
    },
  });

  const isExecuting = creating || updating;

  // ── Submit handlers ─────────────────────────────────────────────────────────
  const handleCreate = (data: CreateFields) => {
    setFormError(null);
    execCreate(data);
  };

  const handleEdit = (data: EditFields) => {
  setFormError(null);
  execUpdate(data);   // ← no need to spread initialData.id separately
};

  // ── Shared select fields ────────────────────────────────────────────────────
  // Both forms share the same role + branch selects; we render them once
  // inside whichever <form> is active.

  const roleField = (
    control: any,
    fieldName: 'roleId',
  ) => (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Role</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={isExecuting}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role">
                  {field.value && (
                    <span className="truncate">
                      {roles.find((r) => r.id === field.value)?.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{role.name}</span>
                    {role.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {role.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const branchField = (control: any, fieldName: 'branchId') => (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Branch</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={isExecuting}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a branch">
                  {field.value && (
                    <span className="truncate">
                      {branches.find((b) => b.id === field.value)?.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{branch.name}</span>
                    {branch.address && (
                      <span className="text-xs text-muted-foreground truncate">
                        {branch.address}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {formError && <ErrorMessage message={formError} />}

      {/* ── EDIT FORM ─────────────────────────────────────────────────────── */}
      {isEdit ? (
        <Form {...editForm}>
          <form 
  onSubmit={editForm.handleSubmit(handleEdit, (errors) => {
    console.log('Validation errors:', errors);  // ← add this
  })} 
  className="space-y-4"
>
  <input type="hidden" {...editForm.register('id')} /> 
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user's full name" disabled={isExecuting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter user's email address"
                      type="email"
                      autoComplete="email"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      type="tel"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {roleField(editForm.control, 'roleId')}
            {branchField(editForm.control, 'branchId')}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isExecuting} className="w-full">
                {updating ? 'Updating User…' : 'Update User'}
              </Button>
            </div>
          </form>
        </Form>

      ) : (

        /* ── CREATE FORM ──────────────────────────────────────────────────── */
        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter user's full name"
                      autoComplete="name"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter user's email address"
                      type="email"
                      autoComplete="email"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      type="tel"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter user's password"
                      type="password"
                      autoComplete="new-password"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Confirm user's password"
                      type="password"
                      autoComplete="new-password"
                      disabled={isExecuting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {roleField(createForm.control, 'roleId')}
            {branchField(createForm.control, 'branchId')}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isExecuting} className="w-full">
                {creating ? 'Creating User…' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}