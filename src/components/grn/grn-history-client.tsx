"use client";

import { useState } from "react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ChevronRight, Package, CheckCircle2, Clock, XCircle, Building2, Truck } from "lucide-react";

type GRNItem = {
  id: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  total: number;
  product: { product_name: string; sku: string } | null;
};

type GRN = {
  id: string;
  grnNo: string;
  receivedDate: Date;
  status: "Draft" | "Verified" | "Rejected";
  notes?: string;
  supplier: { name: string } | null;
  branch: { name: string } | null;
  purchase: { purchaseNo?: string } | null;
  items: GRNItem[];
};

const STATUS_CONFIG = {
  Verified: { color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle2 size={12} />, label: "Verified" },
  Draft:    { color: "#d97706", bg: "#fffbeb", icon: <Clock        size={12} />, label: "Draft" },
  Rejected: { color: "#dc2626", bg: "#fef2f2", icon: <XCircle      size={12} />, label: "Rejected" },
};

function GRNRow({ grn }: { grn: GRN }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[grn.status];
  const totalValue = grn.items.reduce((s, i) => s + i.total, 0);
  const totalReceived = grn.items.reduce((s, i) => s + i.receivedQty, 0);
  const totalOrdered = grn.items.reduce((s, i) => s + i.orderedQty, 0);

  return (
    <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: open ? "var(--color-background-secondary)" : "var(--color-background-primary)", transition: "background 0.1s" }}
      >
        <div style={{ color: "var(--color-text-secondary)", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
          <ChevronRight size={14} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#7F77DD", fontFamily: "monospace" }}>{grn.grnNo}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{formatDate(grn.receivedDate)}</span>
            {grn.branch && (
              <span style={{ fontSize: 10, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", padding: "1px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 }}>
                <Building2 size={9} /> {grn.branch.name}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3, display: "flex", alignItems: "center", gap: 12 }}>
            {grn.supplier && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Truck size={10} /> {grn.supplier.name}</span>}
            <span>{grn.items.length} product{grn.items.length !== 1 ? "s" : ""} • {totalReceived}/{totalOrdered} units received</span>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(totalValue)}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg, marginTop: 2 }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          {grn.notes && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--color-background-primary)", borderRadius: 6, fontSize: 12, color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>
              📝 {grn.notes}
            </div>
          )}
          <table style={{ width: "100%", fontSize: 12, marginTop: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--color-text-secondary)" }}>
                <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 500 }}>Product</th>
                <th style={{ textAlign: "center", padding: "4px 8px", fontWeight: 500 }}>Ordered</th>
                <th style={{ textAlign: "center", padding: "4px 8px", fontWeight: 500 }}>Received</th>
                <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>Unit Price</th>
                <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {grn.items.map((item) => {
                const shortfall = item.orderedQty - item.receivedQty;
                return (
                  <tr key={item.id} style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "6px 0" }}>
                      <div style={{ fontWeight: 500 }}>{item.product?.product_name ?? "Unknown"}</div>
                      {item.product?.sku && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{item.product.sku}</div>}
                    </td>
                    <td style={{ textAlign: "center", padding: "6px 8px" }}>{item.orderedQty}</td>
                    <td style={{ textAlign: "center", padding: "6px 8px" }}>
                      <span style={{ color: shortfall > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{item.receivedQty}</span>
                      {shortfall > 0 && <span style={{ fontSize: 10, color: "#dc2626", marginLeft: 4 }}>(-{shortfall})</span>}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 0" }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: "right", padding: "6px 0", fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function GRNHistoryClient({ grns }: { grns: GRN[] }) {
  const [filter, setFilter] = useState<"All" | "Draft" | "Verified" | "Rejected">("All");

  const filtered = filter === "All" ? grns : grns.filter((g) => g.status === filter);
  const totalValue = filtered.reduce((s, g) => s + g.items.reduce((si, i) => si + i.total, 0), 0);

  const counts = {
    All:      grns.length,
    Verified: grns.filter((g) => g.status === "Verified").length,
    Draft:    grns.filter((g) => g.status === "Draft").length,
    Rejected: grns.filter((g) => g.status === "Rejected").length,
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>GRN History</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
          Full record of all goods received across all branches
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total GRNs",    value: grns.length,                                     color: "#7F77DD" },
          { label: "Verified",      value: counts.Verified,                                  color: "#16a34a" },
          { label: "Pending Draft", value: counts.Draft,                                     color: "#d97706" },
          { label: "Rejected",      value: counts.Rejected,                                  color: "#dc2626" },
          { label: "Total Value",   value: formatCurrency(grns.reduce((s, g) => s + g.items.reduce((si, i) => si + i.total, 0), 0)), color: "#7F77DD" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--color-background-secondary)", borderRadius: 10, padding: 4, marginBottom: 20, border: "0.5px solid var(--color-border-tertiary)", width: "fit-content" }}>
        {(["All", "Verified", "Draft", "Rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", border: filter === f ? "0.5px solid var(--color-border-secondary)" : "none",
              borderRadius: 7, background: filter === f ? "var(--color-background-primary)" : "transparent",
              color: filter === f ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer", fontSize: 12, fontWeight: filter === f ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {f}
            <span style={{ background: filter === f ? "#7F77DD" : "var(--color-border-secondary)", color: filter === f ? "white" : "var(--color-text-secondary)", borderRadius: 20, padding: "0 6px", fontSize: 10, fontWeight: 700 }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* GRN list */}
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total: {formatCurrency(totalValue)}</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-text-secondary)" }}>
          <div style={{ opacity: 0.2, marginBottom: 12 }}><Package size={40} /></div>
          <div style={{ fontSize: 14 }}>No GRNs found</div>
        </div>
      ) : (
        filtered.map((grn) => <GRNRow key={grn.id} grn={grn} />)
      )}
    </div>
  );
}