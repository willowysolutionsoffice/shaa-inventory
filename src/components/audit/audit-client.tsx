"use client";

import { useState } from "react";
import {
  Shield, Activity, Search, Filter,
  ChevronRight, User, Clock, Monitor,
  Package, ShoppingBag, Receipt, Users,
  Truck, Wallet, Settings, FileText,
  TrendingUp, RotateCcw, LogIn, LogOut,
  Download, Printer, Eye, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AuditLog, ActivityLog, AuditAction, AuditModule, ActivityType } from "@/lib/mock-audit-db";

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtDateTime = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
};

const timeAgo = (d: Date | string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Action config ──────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<AuditAction, { label: string; color: string; bg: string }> = {
  CREATE:        { label: "Created",       color: "#16a34a", bg: "#f0fdf4" },
  UPDATE:        { label: "Updated",       color: "#2563eb", bg: "#eff6ff" },
  DELETE:        { label: "Deleted",       color: "#dc2626", bg: "#fef2f2" },
  STATUS_CHANGE: { label: "Status",        color: "#7c3aed", bg: "#f5f3ff" },
  PAYMENT:       { label: "Payment",       color: "#0891b2", bg: "#ecfeff" },
  STOCK_ADJUST:  { label: "Stock Adjust",  color: "#d97706", bg: "#fffbeb" },
};

const MODULE_ICON: Record<AuditModule, React.ReactNode> = {
  Purchase: <ShoppingBag size={13} />,
  Sale:     <Receipt     size={13} />,
  Product:  <Package     size={13} />,
  Customer: <Users       size={13} />,
  Supplier: <Truck       size={13} />,
  Expense:  <Wallet      size={13} />,
  User:     <User        size={13} />,
  Role:     <Shield      size={13} />,
  Branch:   <Settings    size={13} />,
  Stock:    <TrendingUp  size={13} />,
  Return:   <RotateCcw   size={13} />,
};

const ACTIVITY_ICON: Record<ActivityType, React.ReactNode> = {
  LOGIN:     <LogIn    size={13} />,
  LOGOUT:    <LogOut   size={13} />,
  PAGE_VIEW: <Eye      size={13} />,
  EXPORT:    <Download size={13} />,
  PRINT:     <Printer  size={13} />,
  SEARCH:    <Search   size={13} />,
  FILTER:    <Filter   size={13} />,
  REPORT:    <FileText size={13} />,
};

const ACTIVITY_COLOR: Record<ActivityType, { color: string; bg: string }> = {
  LOGIN:     { color: "#16a34a", bg: "#f0fdf4" },
  LOGOUT:    { color: "#6b7280", bg: "#f9fafb" },
  PAGE_VIEW: { color: "#2563eb", bg: "#eff6ff" },
  EXPORT:    { color: "#7c3aed", bg: "#f5f3ff" },
  PRINT:     { color: "#0891b2", bg: "#ecfeff" },
  SEARCH:    { color: "#d97706", bg: "#fffbeb" },
  FILTER:    { color: "#d97706", bg: "#fffbeb" },
  REPORT:    { color: "#dc2626", bg: "#fef2f2" },
};

// ── Audit Row ─────────────────────────────────────────────────────────────────

function AuditRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const action = ACTION_CONFIG[log.action];

  return (
    <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: open ? "var(--color-background-secondary)" : "var(--color-background-primary)", transition: "background 0.1s" }}
      >
        {/* Chevron */}
        <div style={{ color: "var(--color-text-secondary)", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
          <ChevronRight size={13} />
        </div>

        {/* Action badge */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: action.color, background: action.bg, flexShrink: 0 }}>
          {action.label}
        </span>

        {/* Module + entity */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: 12, flexShrink: 0 }}>
          {MODULE_ICON[log.module]}
          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{log.module}</span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#7F77DD" }}>{log.entityLabel}</span>
        </div>

        {/* Description */}
        <div style={{ flex: 1, fontSize: 12, color: "var(--color-text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.description}
        </div>

        {/* User + time */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{log.userName}</div>
          <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{timeAgo(log.timestamp)}</div>
        </div>
      </div>

      {open && (
        <div style={{ padding: "12px 16px 14px", borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Timestamp",  value: fmtDateTime(log.timestamp) },
              { label: "User",       value: `${log.userName} (${log.userRole})` },
              { label: "Branch",     value: log.branchName },
              { label: "IP Address", value: log.ipAddress ?? "—" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Before / After */}
          {(log.before || log.after) && (
            <div style={{ display: "grid", gridTemplateColumns: log.before && log.after ? "1fr 1fr" : "1fr", gap: 10 }}>
              {log.before && (
                <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 6, textTransform: "uppercase" }}>Before</div>
                  {Object.entries(log.before).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, color: "#7f1d1d", marginBottom: 2 }}>
                      <span style={{ fontWeight: 500 }}>{k}:</span> {String(Array.isArray(v) ? `[${(v as unknown[]).length} items]` : v)}
                    </div>
                  ))}
                </div>
              )}
              {log.after && (
                <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", marginBottom: 6, textTransform: "uppercase" }}>After</div>
                  {Object.entries(log.after).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, color: "#14532d", marginBottom: 2 }}>
                      <span style={{ fontWeight: 500 }}>{k}:</span> {String(Array.isArray(v) ? `[${(v as unknown[]).length} items]` : v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Activity Row ──────────────────────────────────────────────────────────────

function ActivityRow({ log }: { log: ActivityLog }) {
  const cfg = ACTIVITY_COLOR[log.activityType];
  const icon = ACTIVITY_ICON[log.activityType];

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, marginBottom: 6, background: "var(--color-background-primary)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, flexShrink: 0, marginTop: 1 }}>
        {icon} {log.activityType.replace("_", " ")}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{log.description}</div>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><User size={10} /> {log.userName}</span>
          <span>{log.branchName}</span>
          {log.page && <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7F77DD" }}>{log.page}</span>}
          {log.ipAddress && <span>{log.ipAddress}</span>}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500 }}>{timeAgo(log.timestamp)}</div>
        <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{fmtDateTime(log.timestamp)}</div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  auditLogs: AuditLog[];
  activityLogs: ActivityLog[];
}

export function AuditClient({ auditLogs, activityLogs }: Props) {
  const [tab, setTab] = useState<"audit" | "activity">("audit");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "All">("All");
  const [moduleFilter, setModuleFilter] = useState<AuditModule | "All">("All");

  // Filter audit logs
  const filteredAudit = auditLogs.filter((log) => {
    const matchSearch = search === "" ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.entityLabel.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All" || log.action === actionFilter;
    const matchModule = moduleFilter === "All" || log.module === moduleFilter;
    return matchSearch && matchAction && matchModule;
  });

  // Filter activity logs
  const filteredActivity = activityLogs.filter((log) =>
    search === "" ||
    log.description.toLowerCase().includes(search.toLowerCase()) ||
    log.userName.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { id: "audit"    as const, label: "Audit Log",      icon: <Shield   size={13} />, count: auditLogs.length },
    { id: "activity" as const, label: "Activity Log",   icon: <Activity size={13} />, count: activityLogs.length },
  ];

  const actions    = ["All", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "PAYMENT", "STOCK_ADJUST"] as const;
  const modules    = ["All", "Purchase", "Sale", "Product", "Customer", "Supplier", "Expense", "User", "Role", "Branch", "Stock", "Return"] as const;

  // Summary stats
  const todayAudit = auditLogs.filter((l) => Date.now() - new Date(l.timestamp).getTime() < 86400000).length;
  const uniqueUsers = new Set(auditLogs.map((l) => l.userId)).size;
  const deletes    = auditLogs.filter((l) => l.action === "DELETE").length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={20} style={{ color: "#7F77DD" }} /> Audit & Activity Logs
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
          Full trail of system changes and user activity across all branches
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Changes",    value: auditLogs.length,    color: "#7F77DD" },
          { label: "Today",            value: todayAudit,          color: "#16a34a" },
          { label: "Active Users",     value: uniqueUsers,         color: "#2563eb" },
          { label: "Deletions",        value: deletes,             color: "#dc2626" },
          { label: "Activity Events",  value: activityLogs.length, color: "#d97706" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: "var(--color-background-secondary)", borderRadius: 10, padding: 4, marginBottom: 16, border: "0.5px solid var(--color-border-tertiary)", width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px", border: tab === t.id ? "0.5px solid var(--color-border-secondary)" : "none",
              borderRadius: 8, background: tab === t.id ? "var(--color-background-primary)" : "transparent",
              color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {t.icon} {t.label}
            <span style={{ background: tab === t.id ? "#7F77DD" : "var(--color-border-secondary)", color: tab === t.id ? "white" : "var(--color-text-secondary)", borderRadius: 20, padding: "0 6px", fontSize: 10, fontWeight: 700 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "audit" ? "Search by user, entity, description..." : "Search activity..."}
            style={{ width: "100%", padding: "7px 10px 7px 30px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 12, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
          />
        </div>

        {tab === "audit" && (
          <>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditAction | "All")}
              style={{ padding: "7px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 12, background: "var(--color-background-primary)", color: "var(--color-text-primary)", cursor: "pointer" }}
            >
              {actions.map((a) => <option key={a} value={a}>{a === "All" ? "All Actions" : ACTION_CONFIG[a as AuditAction]?.label ?? a}</option>)}
            </select>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as AuditModule | "All")}
              style={{ padding: "7px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 12, background: "var(--color-background-primary)", color: "var(--color-text-primary)", cursor: "pointer" }}
            >
              {modules.map((m) => <option key={m} value={m}>{m === "All" ? "All Modules" : m}</option>)}
            </select>
          </>
        )}

        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {tab === "audit" ? filteredAudit.length : filteredActivity.length} record{(tab === "audit" ? filteredAudit : filteredActivity).length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Audit tab ─────────────────────────────────────────────────────── */}
      {tab === "audit" && (
        <div>
          {filteredAudit.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-text-secondary)" }}>
              <div style={{ opacity: 0.2, marginBottom: 12 }}><Shield size={40} /></div>
              <div style={{ fontSize: 14 }}>No audit logs match your filters</div>
            </div>
          ) : (
            filteredAudit.map((log) => <AuditRow key={log.id} log={log} />)
          )}
        </div>
      )}

      {/* ── Activity tab ──────────────────────────────────────────────────── */}
      {tab === "activity" && (
        <div>
          {filteredActivity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-text-secondary)" }}>
              <div style={{ opacity: 0.2, marginBottom: 12 }}><Activity size={40} /></div>
              <div style={{ fontSize: 14 }}>No activity logs found</div>
            </div>
          ) : (
            filteredActivity.map((log) => <ActivityRow key={log.id} log={log} />)
          )}
        </div>
      )}
    </div>
  );
}