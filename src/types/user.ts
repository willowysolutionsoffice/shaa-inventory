export type Role = {
  id: string;
  name: string;
  value: string;
  description?: string;
};

export type Branch = {
  id: string;
  name: string;
  address?: string;
};

// export type User = {
//   id: string;
//   name: string;
//   email: string;
//   role: string; // This is likely role.name or role.id, depending on usage
//   branch: string;
//   createdAt: Date;
//   updatedAt: Date;
// };

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  branch: string;
  role: string;
};

export type UsersTableProps = {
  users: User[];
  roles: Role[];
  branches: Branch[];
};

export type UserFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  branch: string;
};

export type UserFormProps = {
  roles: Role[];
  branches: Branch[];
  onSuccess?: () => void;
  initialData?: Partial<UserFormData>;
  isEdit?: boolean;
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  branch?: string | null;
}
