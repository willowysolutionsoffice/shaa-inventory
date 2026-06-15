// src/components/users-table.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import {
  IconSearch, IconDotsVertical, IconTrash, IconPencil,
} from '@tabler/icons-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { deleteUser, updateUser, type User } from '@/actions/user-action';
import { UserForm } from './user-form';

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

interface UsersTableProps {
  users:    User[];
  roles:    RoleOption[];
  branches: BranchOption[];
}

function roleColor(colorKey: string | undefined) {
  switch (colorKey?.toUpperCase()) {
    case 'RED':    return 'text-red-600 dark:text-red-400';
    case 'GREEN':  return 'text-green-600 dark:text-green-400';
    case 'BLUE':   return 'text-blue-600 dark:text-blue-400';
    case 'PURPLE': return 'text-purple-600 dark:text-purple-400';
    case 'ORANGE': return 'text-orange-600 dark:text-orange-400';
    default:       return 'text-gray-600 dark:text-gray-400';
  }
}

export function UsersTable({ users, roles, branches }: UsersTableProps) {
  const router = useRouter();

  const [searchQuery,          setSearchQuery]          = useState('');
  const [userToDelete,         setUserToDelete]         = useState<User | null>(null);
  const [showDeleteDialog,     setShowDeleteDialog]     = useState(false);
  const [isDeleting,           setIsDeleting]           = useState(false);
  const [updatingRoleUserId,   setUpdatingRoleUserId]   = useState<string | null>(null);
  const [updatingBranchUserId, setUpdatingBranchUserId] = useState<string | null>(null);
  const [editingUser,          setEditingUser]          = useState<User | null>(null);
  const [showEditDialog,       setShowEditDialog]       = useState(false);

  const { execute: execUpdate } = useAction(updateUser, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('User updated');
      router.refresh();
    },
    onError: (e) => {
      console.error('updateUser onError:', e);
      toast.error('Failed to update user. Please try again.');
    },
    onSettled: () => {
      setUpdatingRoleUserId(null);
      setUpdatingBranchUserId(null);
    },
  });

  const { execute: execDelete } = useAction(deleteUser, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      router.refresh();
    },
    onError: () => toast.error('Failed to delete user. Please try again.'),
    onSettled: () => setIsDeleting(false),
  });

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role?.name?.toLowerCase().includes(q) ||
        u.branch?.name?.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  // ── Use role.id and branch.id (not flat roleId/branchId) ─────────────────

  const handleRoleUpdate = (user: User, newRoleId: string) => {
    if (newRoleId === user.role?.id) return;
    setUpdatingRoleUserId(user.id);
    execUpdate({
      id:       user.id,
      name:     user.name,
      email:    user.email,
      roleId:   newRoleId,
      branchId: user.branch?.id ?? '',
      phone:    user.phone ?? undefined,
    });
  };

  const handleBranchUpdate = (user: User, newBranchId: string) => {
    if (newBranchId === user.branch?.id) return;
    setUpdatingBranchUserId(user.id);
    execUpdate({
      id:       user.id,
      name:     user.name,
      email:    user.email,
      roleId:   user.role?.id ?? '',
      branchId: newBranchId,
      phone:    user.phone ?? undefined,
    });
  };

  const handleDeleteClick   = (user: User) => { setUserToDelete(user); setShowDeleteDialog(true); };
  const handleDeleteCancel  = () => { setShowDeleteDialog(false); setUserToDelete(null); };
  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    execDelete({ id: userToDelete.id });
  };
  const handleEditClick = (user: User) => { setEditingUser(user); setShowEditDialog(true); };

  const RoleSelect = ({ user }: { user: User }) => {
    const isUpdating = updatingRoleUserId === user.id;
    return (
      <div className="flex items-center gap-2">
        <Select
          value={user.role?.id ?? ''}
          onValueChange={(v) => handleRoleUpdate(user, v)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-36 h-8 border-none shadow-none p-2 hover:bg-muted/50 focus:ring-1 focus:ring-ring">
            <SelectValue>
              <span className={`text-sm font-medium ${roleColor(user.role?.color)}`}>
                {user.role?.name ?? 'No Role'}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{r.name}</span>
                  {r.description && (
                    <span className="text-xs text-muted-foreground">{r.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUpdating && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        )}
      </div>
    );
  };

  const BranchSelect = ({ user }: { user: User }) => {
    const isUpdating = updatingBranchUserId === user.id;
    return (
      <div className="flex items-center gap-2">
        <Select
          value={user.branch?.id ?? ''}
          onValueChange={(v) => handleBranchUpdate(user, v)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-36 h-8 border-none shadow-none p-2 hover:bg-muted/50 focus:ring-1 focus:ring-ring">
            <SelectValue>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {user.branch?.name ?? 'No Branch'}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-blue-600 dark:text-blue-400">{b.name}</span>
                  {b.address && (
                    <span className="text-xs text-muted-foreground">{b.address}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUpdating && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        )}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions. Total users: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <IconSearch className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell><RoleSelect user={user} /></TableCell>
                        <TableCell><BranchSelect user={user} /></TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <IconPencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editingUser && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <UserForm
              isEdit
              roles={roles}
              branches={branches}
              initialData={{
                id:       editingUser.id,
                name:     editingUser.name,
                email:    editingUser.email,
                phone:    editingUser.phone ?? undefined,
                roleId:   editingUser.role?.id   ?? '',   // ← fixed
                branchId: editingUser.branch?.id ?? '',   // ← fixed
              }}
              onSuccess={() => {
                setShowEditDialog(false);
                setEditingUser(null);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-semibold">{userToDelete?.name}</span> and remove
              their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}