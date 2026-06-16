"use client";

// src/components/customers/customer-history-client.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, RotateCcw, Star,
  ChevronRight, Award, Crown, Shield,
  CheckCircle2, Clock, AlertCircle, Phone, Mail,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Customer {
  id:       string;
  name:     string;
  email?:   string | null;
  phone?:   string | null;
  branchId: string;
  branch?:  { name: string } | null;
}

interface SaleItem {
  id:           string;
  quantity:     number;
  unitPrice:    number;
  discount:     number;
  total:        number;
  product:      { product_name: string; sku?: string } | null;
}

interface Sale {
  id:            string;
  invoiceNo:     string;
  salesdate:     Date | string;
  grandTotal:    number;
  paymentDue:    number;
  paymentStatus: string;
  items:         SaleItem[];
  payments:      { paymentMethod: string; amount: number }[];
  branch:        { name: string } | null;
}

interface ReturnItem {
  id:        string;
  quantity:  number;
  unitPrice: number;
  total:     number;
  product:   { product_name: string; sku?: string } | null;
}

interface SalesReturn {
  id:          string;
  returnNo:    string;
  returnDate:  Date | string;
  grandTotal:  number;
  items:       ReturnItem[];
  branch:      { name: string } | null;
}

interface Props {
  customer:      Customer;
  sales:         Sale[];
  returns:       SalesReturn[];
  loyaltyPoints: number;
  loyaltyTier:   "Bronze" | "Silver" | "Gold" | "Platinum";
  totalSpent:    number;
  totalReturned: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDateTime = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
};

const TIER_CONFIG = {
  Bronze:   { color: "#cd7f32", bg: "#fdf3e7", icon: <Shield size={14} />,  next: "Silver",   needed: 200  },
  Silver:   { color: "#9e9e9e", bg: "#f5f5f5", icon: <Star size={14} />,    next: "Gold",     needed: 500  },
  Gold:     { color: "#f5a623", bg: "#fff8e7", icon: <Award size={14} />,   next: "Platinum", needed: 1000 },
  Platinum: { color: "#7F77DD", bg: "#EEEDFE", icon: <Crown size={14} />,   next: null,       needed: null },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PAID:    { label: "Paid",    color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle2 size={11} /> },
  PARTIAL: { label: "Partial", color: "#d97706", bg: "#fffbeb", icon: <Clock size={11} /> },
  PENDING: { label: "Due",     color: "#dc2626", bg: "#fef2f2", icon: <AlertCircle size={11} /> },
};

// ── Sale Row ───────────────────────────────────────────────────────────────────

function SaleRow({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false);
  const cfg    = STATUS_CONFIG[sale.paymentStatus] ?? STATUS_CONFIG.PENDING;
  const method = sale.payments?.[0]?.paymentMethod ?? "—";

  return (
    <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: open ? "var(--color-background-secondary)" : "var(--color-background-primary)" }}
      >
        <div style={{ color: "var(--color-text-secondary)", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "none" }}>
          <ChevronRight size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#7F77DD", fontFamily: "monospace" }}>{sale.invoiceNo}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{fmtDateTime(sale.salesdate)}</span>
            {sale.branch && (
              <span style={{ fontSize: 10, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", padding: "1px 6px", borderRadius: 4 }}>
                {sale.branch.name}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {sale.items.length} item{sale.items.length !== 1 ? "s" : ""} • {method}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(sale.grandTotal)}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg, marginTop: 2 }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <table style={{ width: "100%", fontSize: 12, marginTop: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--color-text-secondary)" }}>
                <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 500 }}>Product</th>
                <th style={{ textAlign: "center", padding: "4px 8px", fontWeight: 500 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>Price</th>
                <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "6px 0" }}>
                    <div style={{ fontWeight: 500 }}>{item.product?.product_name ?? "Unknown"}</div>
                    {item.product?.sku && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{item.product.sku}</div>}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "6px 0" }}>{fmt(item.unitPrice)}</td>
                  <td style={{ textAlign: "right", padding: "6px 0", fontWeight: 600 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Return Row ─────────────────────────────────────────────────────────────────

function ReturnRow({ ret }: { ret: SalesReturn }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "0.5px solid #fecaca", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: open ? "#fef2f2" : "var(--color-background-primary)" }}
      >
        <div style={{ color: "#dc2626", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "none" }}>
          <ChevronRight size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#dc2626", fontFamily: "monospace" }}>{ret.returnNo}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{fmtDateTime(ret.returnDate)}</span>
            {ret.branch && (
              <span style={{ fontSize: 10, color: "#dc2626", background: "#fef2f2", padding: "1px 6px", borderRadius: 4 }}>
                {ret.branch.name}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {ret.items.length} item{ret.items.length !== 1 ? "s" : ""} returned
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626" }}>−{fmt(ret.grandTotal)}</div>
      </div>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "0.5px solid #fecaca", background: "#fef2f2" }}>
          <table style={{ width: "100%", fontSize: 12, marginTop: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#b91c1c" }}>
                <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 500 }}>Product</th>
                <th style={{ textAlign: "center", padding: "4px 8px", fontWeight: 500 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>Price</th>
                <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>Refund</th>
              </tr>
            </thead>
            <tbody>
              {ret.items.map((item) => (
                <tr key={item.id} style={{ borderTop: "0.5px solid #fecaca" }}>
                  <td style={{ padding: "6px 0" }}>
                    <div style={{ fontWeight: 500 }}>{item.product?.product_name ?? "Unknown"}</div>
                    {item.product?.sku && <div style={{ fontSize: 10, color: "#b91c1c" }}>{item.product.sku}</div>}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "6px 0" }}>{fmt(item.unitPrice)}</td>
                  <td style={{ textAlign: "right", padding: "6px 0", fontWeight: 600, color: "#dc2626" }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function CustomerHistoryClient({ customer, sales, returns, loyaltyPoints, loyaltyTier, totalSpent, totalReturned }: Props) {
  const router  = useRouter();
  const [tab, setTab] = useState<"purchases" | "returns" | "rewards">("purchases");

  const tier          = TIER_CONFIG[loyaltyTier];
  const netSpent      = totalSpent - totalReturned;
  const pointsToNext  = tier.needed ? tier.needed - loyaltyPoints : 0;
  const progressPct   = tier.needed ? Math.min(100, (loyaltyPoints / tier.needed) * 100) : 100;

  const TABS = [
    { id: "purchases" as const, label: "Purchases", icon: <ShoppingBag size={13} />, count: sales.length },
    { id: "returns"   as const, label: "Returns",   icon: <RotateCcw size={13} />,   count: returns.length },
    { id: "rewards"   as const, label: "Rewards",   icon: <Star size={13} />,         count: loyaltyPoints },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft size={15} /> Back to Customers
      </button>

      {/* Customer card */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #7F77DD, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 20 }}>{customer.name.charAt(0)}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{customer.name}</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}30` }}>
              {tier.icon} {loyaltyTier}
            </span>
            {customer.phone && (
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                <Phone size={11} /> {customer.phone}
              </span>
            )}
            {customer.email && (
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                <Mail size={11} /> {customer.email}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
          {[
            { label: "Total Spent",    value: fmt(netSpent),           color: "#7F77DD" },
            { label: "Purchases",      value: String(sales.length),    color: "#16a34a" },
            { label: "Returns",        value: String(returns.length),  color: "#dc2626" },
            { label: "Loyalty Points", value: `${loyaltyPoints} pts`,  color: tier.color },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px 12px", minWidth: 80, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: "var(--color-background-secondary)", borderRadius: 10, padding: 4, marginBottom: 20, border: "0.5px solid var(--color-border-tertiary)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 10px",
              border: tab === t.id ? "0.5px solid var(--color-border-secondary)" : "none",
              borderRadius: 8,
              background: tab === t.id ? "var(--color-background-primary)" : "transparent",
              color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span style={{ background: tab === t.id ? "#7F77DD" : "var(--color-border-secondary)", color: tab === t.id ? "white" : "var(--color-text-secondary)", borderRadius: 20, padding: "0 6px", fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: "center" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Purchases */}
      {tab === "purchases" && (
        <div>
          {sales.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={32} />} message="No purchases yet" />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{sales.length} transaction{sales.length !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Total: {fmt(totalSpent)}</span>
              </div>
              {sales.map((s) => <SaleRow key={s.id} sale={s} />)}
            </>
          )}
        </div>
      )}

      {/* Returns */}
      {tab === "returns" && (
        <div>
          {returns.length === 0 ? (
            <EmptyState icon={<RotateCcw size={32} />} message="No returns on record" />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{returns.length} return{returns.length !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Total Refunded: {fmt(totalReturned)}</span>
              </div>
              {returns.map((r) => <ReturnRow key={r.id} ret={r} />)}
            </>
          )}
        </div>
      )}

      {/* Rewards */}
      {tab === "rewards" && (
        <div>
          {/* Tier card */}
          <div style={{ background: `linear-gradient(135deg, ${tier.color}15, ${tier.color}05)`, border: `1px solid ${tier.color}40`, borderRadius: 14, padding: "24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: tier.bg, border: `2px solid ${tier.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: tier.color, transform: "scale(1.8)" }}>{tier.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>Current Tier</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: tier.color }}>{loyaltyTier}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: tier.color }}>{loyaltyPoints.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Points earned</div>
              </div>
            </div>

            {tier.needed ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  <span>{loyaltyPoints} pts</span>
                  <span>{pointsToNext} pts to {tier.next}</span>
                </div>
                <div style={{ height: 8, background: `${tier.color}20`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: tier.color, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", fontSize: 13, color: tier.color, fontWeight: 600, marginTop: 8 }}>
                🎉 Maximum tier reached — Platinum member!
              </div>
            )}
          </div>

          {/* Points breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Earned from purchases", value: `+${Math.floor(totalSpent / 100)} pts`,    color: "#16a34a" },
              { label: "Deducted from returns",  value: `−${Math.floor(totalReturned / 100)} pts`, color: "#dc2626" },
              { label: "Net points",             value: `${loyaltyPoints} pts`,                    color: tier.color },
              { label: "Total purchase value",   value: fmt(totalSpent),                           color: "#7F77DD" },
            ].map((row) => (
              <div key={row.label} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: row.color }}>{row.value}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{row.label}</div>
              </div>
            ))}
          </div>

          {/* Tier perks */}
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tier Benefits</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {([
              { tier: "Bronze",   pts: "0+",    perks: ["Birthday discount 2%", "Early sale access"],                                           color: "#cd7f32" },
              { tier: "Silver",   pts: "200+",  perks: ["5% discount on all purchases", "Priority billing", "Free gift wrapping"],               color: "#9e9e9e" },
              { tier: "Gold",     pts: "500+",  perks: ["10% discount on all purchases", "Dedicated manager", "Free delivery"],                  color: "#f5a623" },
              { tier: "Platinum", pts: "1000+", perks: ["15% discount on all purchases", "Exclusive preview events", "Free alterations", "VIP"], color: "#7F77DD" },
            ] as const).map((t) => {
              const tiers   = ["Bronze", "Silver", "Gold", "Platinum"] as const;
              const myIdx   = tiers.indexOf(loyaltyTier);
              const rowIdx  = tiers.indexOf(t.tier);
              const unlocked = rowIdx <= myIdx;
              const isCurrent = t.tier === loyaltyTier;

              return (
                <div key={t.tier} style={{ border: isCurrent ? `2px solid ${t.color}` : "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", background: isCurrent ? `${t.color}08` : "var(--color-background-primary)", opacity: unlocked ? 1 : 0.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: t.color }}>{t.tier}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>({t.pts} pts)</span>
                    {isCurrent && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: t.color, background: `${t.color}15`, padding: "2px 8px", borderRadius: 20 }}>YOUR TIER</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {t.perks.map((perk) => (
                      <span key={perk} style={{ fontSize: 11, background: "var(--color-background-secondary)", padding: "3px 8px", borderRadius: 20 }}>
                        {unlocked ? "✓" : "🔒"} {perk}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-text-secondary)" }}>
      <div style={{ opacity: 0.2, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}