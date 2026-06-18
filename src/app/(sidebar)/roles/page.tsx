// src/app/(dashboard)/roles/page.tsx
// Roles CRUD page — wired to the real Express backend via role-action.ts.
// Permissions are managed via src/constants/permissions.ts ROLE_PERMISSIONS map.

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle, Search, Shield, Edit, Trash2, X, Check,
  ShieldCheck, ShieldAlert, Eye, EyeOff, Loader2,
} from "lucide-react";
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  type Role,
} from "@/actions/role-action";
import {
  PERMISSIONS,
  type Permission,
} from "@/constants/permissions";

// ── Permission metadata ───────────────────────────────────────────────────────

const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: PERMISSIONS.VIEW_DASHBOARD,   label: "View Dashboard",   group: "General"      },
  { key: PERMISSIONS.VIEW_REPORTS,     label: "View Reports",     group: "General"      },
  { key: PERMISSIONS.MANAGE_PRODUCTS,  label: "Manage Products",  group: "Inventory"    },
  { key: PERMISSIONS.MANAGE_BRANDS,    label: "Manage Brands",    group: "Inventory"    },
  { key: PERMISSIONS.MANAGE_BRANCHES,  label: "Manage Branches",  group: "Inventory"    },
  { key: PERMISSIONS.MANAGE_CUSTOMERS, label: "Manage Customers", group: "Parties"      },
  { key: PERMISSIONS.MANAGE_SUPPLIERS, label: "Manage Suppliers", group: "Parties"      },
  { key: PERMISSIONS.MANAGE_SALES,     label: "Manage Sales",     group: "Transactions" },
  { key: PERMISSIONS.MANAGE_PURCHASES, label: "Manage Purchases", group: "Transactions" },
  { key: PERMISSIONS.MANAGE_RETURNS,   label: "Manage Returns",   group: "Transactions" },
  { key: PERMISSIONS.MANAGE_EXPENSES,  label: "Manage Expenses",  group: "Finance"      },
  { key: PERMISSIONS.MANAGE_USERS,     label: "Manage Users",     group: "Admin"        },
  { key: PERMISSIONS.MANAGE_ROLES,     label: "Manage Roles",     group: "Admin"        },
];

const PERMISSION_GROUPS = ["General", "Inventory", "Parties", "Transactions", "Finance", "Admin"];

// The backend stores permissions as objects { id, name, label }.
// We work with the `name` string internally (matches PERMISSIONS constants).
function toPermissionKeys(perms: Role['permissions']): Permission[] {
  return perms.map((p) => p.name as Permission);
}

// ── Color helpers ─────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ["PURPLE", "BLUE", "GREEN", "ORANGE", "GRAY"] as const;
type RoleColor = (typeof COLOR_OPTIONS)[number];

const colorMap: Record<string, { icon: string; dot: string }> = {
  PURPLE: { icon: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500" },
  BLUE:   { icon: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",         dot: "bg-blue-500"   },
  GREEN:  { icon: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",     dot: "bg-green-500"  },
  ORANGE: { icon: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
  GRAY:   { icon: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",            dot: "bg-gray-400"   },
};
const getColor = (c: string) => colorMap[c?.toUpperCase()] ?? colorMap.GRAY;

// ── Permission badges ─────────────────────────────────────────────────────────

function PermissionBadges({ permissions }: { permissions: Permission[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? permissions : permissions.slice(0, 3);
  const rest = permissions.length - 3;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map((p) => {
        const label = ALL_PERMISSIONS.find((a) => a.key === p)?.label ?? p;
        return (
          <span key={p}
            className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            {label}
          </span>
        );
      })}
      {!expanded && rest > 0 && (
        <button onClick={() => setExpanded(true)}
          className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors">
          +{rest} more
        </button>
      )}
      {expanded && (
        <button onClick={() => setExpanded(false)}
          className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border hover:bg-muted/70 transition-colors flex items-center gap-1">
          <EyeOff className="h-3 w-3" /> less
        </button>
      )}
    </div>
  );
}

// ── Role Modal ────────────────────────────────────────────────────────────────

interface ModalProps {
  role: Role | null;   // null = create mode
  onClose: () => void;
  onSaved: () => void; // triggers a refetch
}

function RoleModal({ role, onClose, onSaved }: ModalProps) {
  const existingPerms = role ? toPermissionKeys(role.permissions) : [];

  const [name, setName]               = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [color, setColor]             = useState<RoleColor>((role?.color as RoleColor) ?? "PURPLE");
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set(existingPerms));
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const togglePerm = (p: Permission) =>
    setPermissions((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });

  const toggleGroup = (group: string) => {
    const gp = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key);
    const allOn = gp.every((p) => permissions.has(p));
    setPermissions((prev) => {
      const n = new Set(prev);
      gp.forEach((p) => allOn ? n.delete(p) : n.add(p));
      return n;
    });
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError("Role name is required"); return; }
    if (permissions.size === 0) { setError("Select at least one permission"); return; }

    setSaving(true);
    try {
      const permissionNames = Array.from(permissions);

      if (role) {
        const res = await updateRole({
          id: role.id,
          name: name.trim(),
          description,
          color,
          permissions: permissionNames,
        });
        if (res?.data?.error) throw new Error(res.data.error);
        toast.success("Role updated successfully");
      } else {
        const res = await createRole({
          name: name.trim(),
          description,
          color,
          permissions: permissionNames,
        });
        if (res?.data?.error) throw new Error(res.data.error);
        toast.success("Role created successfully");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 text-purple-700 p-1.5 rounded-md">
              <Shield className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-base">
              {role ? `Edit: ${role.name}` : "Add New Role"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Role Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Sales Staff"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role Color</label>
              <div className="flex gap-2 mt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full ${getColor(c).dot} border-2 transition-all ${
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Brief description of this role's responsibilities"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Permissions <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {permissions.size} / {ALL_PERMISSIONS.length} selected
              </span>
            </div>

            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {PERMISSION_GROUPS.map((group) => {
                const gp = ALL_PERMISSIONS.filter((p) => p.group === group);
                const allOn  = gp.every((p) => permissions.has(p.key));
                const someOn = gp.some((p) => permissions.has(p.key));

                return (
                  <div key={group}>
                    <div
                      className="flex items-center justify-between px-4 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleGroup(group)}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group}
                      </span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        allOn ? "bg-purple-600 border-purple-600"
                          : someOn ? "bg-purple-200 border-purple-400"
                          : "border-border"
                      }`}>
                        {allOn && <Check className="h-2.5 w-2.5 text-white" />}
                        {someOn && !allOn && <div className="w-2 h-0.5 bg-purple-600" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 px-4 py-2">
                      {gp.map((p) => {
                        const on = permissions.has(p.key);
                        return (
                          <label key={p.key} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                            <div
                              onClick={() => togglePerm(p.key)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                on
                                  ? "bg-purple-600 border-purple-600"
                                  : "border-border group-hover:border-purple-400"
                              }`}
                            >
                              {on && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span className="text-sm text-foreground/80 select-none">{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/10 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {role ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles, setRoles]               = useState<Role[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [editingRole, setEditingRole]   = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    const res = await getRoleList();
    if (Array.isArray(res?.data?.data)) setRoles(res.data.data);
    else if (res?.data?.error) toast.error(res.data.error);
    else toast.error("Failed to load roles");
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleDelete = async (role: Role) => {
    setDeleting(true);
    try {
      const res = await deleteRole({ id: role.id });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success(`Role "${role.name}" deleted`);
      setDeletingRole(null);
      fetchRoles();
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (role: Role) => {
    const res = await toggleRoleStatus({ id: role.id });
    if (res?.data?.error) { toast.error(res.data.error); return; }
    const updatedStatus = res?.data?.data?.status;
    toast.success(`Role "${role.name}" ${updatedStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    fetchRoles();
  };

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = roles.filter((r) => r.status === "ACTIVE").length;
  const avgPerms    = roles.length
    ? Math.round(roles.reduce((s, r) => s + r.permissions.length, 0) / roles.length)
    : 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
              <p className="text-muted-foreground">Define access levels for your team members</p>
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              onClick={() => { setEditingRole(null); setModalOpen(true); }}
            >
              <PlusCircle className="h-4 w-4" /> Add Role
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Roles",  value: roles.length,           icon: <Shield className="h-4 w-4" />,      color: "PURPLE" },
              { label: "Active Roles", value: activeCount,            icon: <ShieldCheck className="h-4 w-4" />, color: "GREEN"  },
              { label: "Permissions",  value: ALL_PERMISSIONS.length, icon: <Eye className="h-4 w-4" />,         color: "ORANGE" },
              { label: "Avg. Perms",   value: avgPerms,               icon: <ShieldCheck className="h-4 w-4" />, color: "BLUE"   },
            ].map((stat) => (
              <Card key={stat.label} className="border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColor(stat.color).icon}`}>{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card className="border-border shadow-sm">
            <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">All Roles</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-medium border-b border-border text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Permissions</th>
                      <th className="px-4 py-3">Users</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    )}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          No roles found.
                        </td>
                      </tr>
                    )}
                    {!loading && filtered.map((role) => {
                      const c    = getColor(role.color);
                      const keys = toPermissionKeys(role.permissions);

                      return (
                        <tr key={role.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 font-semibold">
                              <div className={`p-1.5 rounded-md ${c.icon}`}>
                                <Shield className="h-4 w-4" />
                              </div>
                              {role.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleStatus(role)}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                                role.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {role.status === "ACTIVE" ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-xs text-xs">
                            {role.description}
                          </td>
                          <td className="px-4 py-3 max-w-sm">
                            <PermissionBadges permissions={keys} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {role.userCount}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              onClick={() => { setEditingRole(role); setModalOpen(true); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => setDeletingRole(role)}
                              disabled={role.userCount > 0}
                              title={role.userCount > 0 ? "Reassign users before deleting" : "Delete role"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <RoleModal
          role={editingRole}
          onClose={() => { setModalOpen(false); setEditingRole(null); }}
          onSaved={fetchRoles}
        />
      )}

      {/* Delete Confirmation */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Delete Role</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80">
              Delete <strong>{deletingRole.name}</strong>? Users assigned this role will lose access.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeletingRole(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deletingRole)}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}