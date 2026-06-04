"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import {
  CheckCircle, Printer, Download, RotateCcw, X, Plus, Minus,
  Receipt, RefreshCw, Search, ChevronRight, ArrowLeft,
  CreditCard, Wallet, IndianRupee, AlertTriangle, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { posRefund } from "@/actions/pos-refund-action";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  productId: string;        // needed by the refund action
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface POSInvoice {
  saleId: string;
  invoiceNo: string;
  date: Date | string;
  customer: { name: string; phone: string };
  branch: { name: string; address: string; phone: string };
  paymentMethod: string;
  items: InvoiceItem[];
  subtotal: number;
  couponDiscount: number;
  couponCode: string;
  manualDiscount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  change: number;
}

export interface POSInvoiceSystemProps {
  invoice: POSInvoice;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const fmtDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year:   "numeric",
    month:  "short",
    day:    "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(d);
};

const toNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};
// ── Sub-components ────────────────────────────────────────────────────────────

function ThermalReceipt({ invoice }: { invoice: POSInvoice }) {
  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 12,
        lineHeight: 1.5,
        background: "white",
        color: "#111",
        width: 320,
        padding: "16px 20px",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          borderBottom: "1px dashed #ccc",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
          SHAA CALICUT
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
          {invoice.branch.address}
        </div>
        <div style={{ fontSize: 10, color: "#555" }}>
          Tel: {invoice.branch.phone}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
          GSTIN: 32AABCS1429B1Z3
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {[
          { label: "Invoice:", value: invoice.invoiceNo, bold: true },
          { label: "Date:", value: fmtDate(invoice.date) },
          { label: "Customer:", value: invoice.customer.name },
          { label: "Payment:", value: invoice.paymentMethod },
        ].map(({ label, value, bold }) => (
          <div
            key={label}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span style={{ color: "#555" }}>{label}</span>
            <span style={bold ? { fontWeight: 700 } : undefined}>{value}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px dashed #ccc",
          borderBottom: "1px dashed #ccc",
          padding: "8px 0",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: 10,
            marginBottom: 4,
            color: "#555",
          }}
        >
          <span style={{ flex: 2 }}>ITEM</span>
          <span style={{ textAlign: "right", width: 30 }}>QTY</span>
          <span style={{ textAlign: "right", width: 50 }}>PRICE</span>
          <span style={{ textAlign: "right", width: 55 }}>TOTAL</span>
        </div>
        {invoice.items.map((item) => (
          <div key={item.id} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 11,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 220,
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
              }}
            >
              <span style={{ flex: 2, color: "#777", fontSize: 10 }}>
                {item.sku}
              </span>
              <span style={{ textAlign: "right", width: 30 }}>{item.qty}</span>
              <span style={{ textAlign: "right", width: 50 }}>
                ₹{item.unitPrice.toLocaleString("en-IN")}
              </span>
              <span style={{ textAlign: "right", width: 55 }}>
                ₹{item.total.toLocaleString("en-IN")}
              </span>
            </div>
            {item.discount > 0 && (
              <div style={{ textAlign: "right", fontSize: 10, color: "green" }}>
                Disc: -₹{item.discount}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 8, fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#555" }}>Subtotal:</span>
          <span>₹{toNum(invoice.subtotal).toLocaleString("en-IN")}</span>
        </div>
        {invoice.couponDiscount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "green",
            }}
          >
            <span>Coupon ({invoice.couponCode}):</span>
            <span>-₹{invoice.couponDiscount.toFixed(2)}</span>
          </div>
        )}
        {invoice.manualDiscount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "green",
            }}
          >
            <span>Instant Discount:</span>
            <span>-₹{invoice.manualDiscount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#555" }}>GST ({invoice.taxRate}%):</span>
          <span>₹{invoice.taxAmount.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: 14,
            borderTop: "1px dashed #ccc",
            paddingTop: 6,
            marginTop: 4,
          }}
        >
          <span>TOTAL:</span>
          <span>₹{toNum(invoice.grandTotal).toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#555",
          }}
        >
          <span>Paid ({invoice.paymentMethod}):</span>
          <span>₹{invoice.amountPaid.toFixed(2)}</span>
        </div>
        {invoice.change > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "green",
              fontWeight: 700,
            }}
          >
            <span>Change:</span>
            <span>₹{invoice.change.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          borderTop: "1px dashed #ccc",
          paddingTop: 10,
          fontSize: 10,
          color: "#777",
        }}
      >
        <div>Thank you for shopping with us!</div>
        <div style={{ marginTop: 2 }}>Exchange within 7 days with bill</div>
        <div style={{ marginTop: 4, fontSize: 9 }}>***</div>
      </div>
    </div>
  );
}

function A4Invoice({ invoice }: { invoice: POSInvoice }) {
  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "white",
        color: "#1a1a1a",
        width: "100%",
        minHeight: 800,
        padding: "40px 48px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "2px solid #1a1a1a",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Shaa Calicut
          </div>
          <div
            style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.6 }}
          >
            {invoice.branch.address}
            <br />
            Tel: {invoice.branch.phone} • GSTIN: 32AABCS1429B1Z3
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Tax Invoice
          </div>
          <div
            style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: 1 }}
          >
            {invoice.invoiceNo}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {fmtDate(invoice.date)}
          </div>
        </div>
      </div>

      {/* Bill-to / Payment */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 28,
        }}
      >
        {[
          {
            title: "Bill To",
            content: (
              <>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {invoice.customer.name}
                </div>
                {invoice.customer.phone && (
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    📞 {invoice.customer.phone}
                  </div>
                )}
              </>
            ),
          },
          {
            title: "Payment Details",
            content: (
              <>
                <div style={{ fontSize: 13 }}>
                  Method: <strong>{invoice.paymentMethod}</strong>
                </div>
                <div style={{ fontSize: 13, marginTop: 2 }}>
                  Status:{" "}
                  <span style={{ color: "#1a7a4a", fontWeight: 600 }}>Paid</span>
                </div>
              </>
            ),
          },
        ].map(({ title, content }) => (
          <div
            key={title}
            style={{
              background: "#f9f9f7",
              padding: "14px 16px",
              borderRadius: 6,
              border: "0.5px solid #e0e0d8",
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#888",
                marginBottom: 6,
              }}
            >
              {title}
            </div>
            {content}
          </div>
        ))}
      </div>

      {/* Items table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 24,
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ background: "#1a1a1a", color: "white" }}>
            {["#", "Item", "Qty", "Unit Price", "Disc", "Total"].map((h, i) => (
              <th
                key={h}
                style={{
                  padding: "10px 12px",
                  textAlign: i === 0 || i === 2 ? "center" : i >= 3 ? "right" : "left",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr
              key={item.id}
              style={{
                background: i % 2 === 0 ? "white" : "#f9f9f7",
                borderBottom: "0.5px solid #e8e8e4",
              }}
            >
              <td style={{ padding: "10px 12px", color: "#888", textAlign: "center" }}>
                {i + 1}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {item.sku}
                </div>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.qty}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>
                {fmt(item.unitPrice)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  color: item.discount > 0 ? "#1a7a4a" : "#999",
                }}
              >
                {item.discount > 0 ? `-${fmt(item.discount)}` : "—"}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                {fmt(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 300 }}>
          {[
            { label: "Subtotal", value: fmt(invoice.subtotal) },
            invoice.couponDiscount > 0
              ? {
                  label: `Coupon (${invoice.couponCode})`,
                  value: `-${fmt(invoice.couponDiscount)}`,
                  color: "#1a7a4a",
                }
              : null,
            invoice.manualDiscount > 0
              ? {
                  label: "Instant Discount",
                  value: `-${fmt(invoice.manualDiscount)}`,
                  color: "#1a7a4a",
                }
              : null,
            {
              label: `GST @ ${invoice.taxRate}%`,
              value: fmt(invoice.taxAmount),
            },
          ]
            .filter(Boolean)
            .map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  fontSize: 13,
                  color: (row as any).color ?? "#555",
                  borderBottom: "0.5px solid #eee",
                }}
              >
                <span>{(row as any).label}</span>
                <span style={{ fontWeight: 500 }}>{(row as any).value}</span>
              </div>
            ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0 8px",
              fontSize: 16,
              fontWeight: 700,
              borderTop: "2px solid #1a1a1a",
              marginTop: 4,
            }}
          >
            <span>Grand Total</span>
            <span>{fmt(toNum(invoice.grandTotal))}</span>
          </div>
          <div
            style={{
              background: "#f0f7f3",
              borderRadius: 6,
              padding: "8px 12px",
              textAlign: "center",
              fontSize: 12,
              color: "#1a7a4a",
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            ✓ Paid via {invoice.paymentMethod}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "0.5px solid #ddd",
          fontSize: 11,
          color: "#888",
          textAlign: "center",
        }}
      >
        <div>
          This is a computer-generated invoice and does not require a signature.
        </div>
        <div style={{ marginTop: 4 }}>
          Exchange within 7 days with original invoice • Customer care:{" "}
          {invoice.branch.phone}
        </div>
      </div>
    </div>
  );
}

// ── Refund Screen ─────────────────────────────────────────────────────────────

interface RefundItem extends InvoiceItem {
  refundQty: number;
}

interface RefundScreenProps {
  invoice: POSInvoice;
  onClose: () => void;
  onComplete: () => void;
}

function RefundScreen({ invoice, onClose, onComplete }: RefundScreenProps) {
  const [search, setSearch] = useState("");
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<"original" | "cash" | "credit">(
    "original"
  );
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "done">("select");
  const [returnNo, setReturnNo] = useState("");

  const { execute: executeRefund, isPending: isRefunding } = useAction(posRefund, {
    onSuccess: ({ data }) => {
      if (data?.returnNo) {
        setReturnNo(data.returnNo);
        setStep("done");
      } else {
        toast.error("Refund processed but no return number returned.");
        setStep("done");
      }
    },
    onError: () => {
      toast.error("Refund failed. Please try again.");
    },
  });

  const filteredItems = invoice.items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (item: InvoiceItem) => {
    const exists = refundItems.find((r) => r.id === item.id);
    if (exists) {
      setRefundItems(refundItems.filter((r) => r.id !== item.id));
    } else {
      setRefundItems([...refundItems, { ...item, refundQty: item.qty }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setRefundItems(
      refundItems.map((r) => {
        if (r.id !== id) return r;
        const orig = invoice.items.find((i) => i.id === id);
        const newQty = Math.min(
          Math.max(r.refundQty + delta, 1),
          orig?.qty ?? r.qty
        );
        return { ...r, refundQty: newQty };
      })
    );
  };

  const refundTotal = refundItems.reduce(
    (sum, r) => sum + r.unitPrice * r.refundQty,
    0
  );

  const REASONS = [
    "Customer changed mind",
    "Wrong size / colour",
    "Defective product",
    "Duplicate billing",
    "Other",
  ];

  const handleRefundConfirm = () => {
    executeRefund({
      saleId: invoice.saleId,
      customerId: invoice.customer.name, // your action may accept name or ID — adjust as needed
      branchId: invoice.branch.name,     // same — adjust if your action expects IDs
      refundMethod,
      reason,
      items: refundItems.map((r) => ({
        productId: r.productId,
        qty: r.refundQty,
        unitPrice: r.unitPrice,
      })),
    });
  };

  // ── Step: done ──────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--color-background-success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle size={36} color="var(--color-text-success)" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>
          Refund Processed
        </div>
        <div
          style={{
            color: "var(--color-text-secondary)",
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          {fmt(refundTotal)} refunded to customer
        </div>
        {returnNo && (
          <div
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              marginBottom: 4,
            }}
          >
            Return #{returnNo}
          </div>
        )}
        <div
          style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 32 }}
        >
          via{" "}
          {refundMethod === "original"
            ? invoice.paymentMethod
            : refundMethod === "cash"
            ? "Cash"
            : "Store Credit"}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--color-text-primary)",
            }}
          >
            Close
          </button>
          <button
            onClick={onComplete}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--border-radius-md)",
              background: "#7F77DD",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            New Transaction
          </button>
        </div>
      </div>
    );
  }

  // ── Step: confirm ───────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div style={{ padding: "0 4px" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}
        >
          <button
            onClick={() => setStep("select")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              padding: 0,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ fontWeight: 500, fontSize: 16 }}>Confirm Refund</div>
        </div>

        <div
          style={{
            background: "var(--color-background-warning)",
            border: "0.5px solid var(--color-border-warning)",
            borderRadius: "var(--border-radius-md)",
            padding: "12px 14px",
            marginBottom: 20,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "var(--color-text-warning)", marginTop: 1, flexShrink: 0 }}
          />
          <div style={{ fontSize: 13, color: "var(--color-text-warning)" }}>
            This action cannot be undone. Stock will be restocked and refund will be
            issued.
          </div>
        </div>

        <div
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Return Items
          </div>
          {refundItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Qty: {item.refundQty} × {fmt(item.unitPrice)}
                </div>
              </div>
              <div style={{ fontWeight: 500 }}>
                {fmt(item.unitPrice * item.refundQty)}
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0 0",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            <span>Refund Amount</span>
            <span style={{ color: "#7F77DD" }}>{fmt(refundTotal)}</span>
          </div>
        </div>

        {/* Refund method */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
            Refund Method
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(
              [
                {
                  key: "original" as const,
                  label: `Original (${invoice.paymentMethod})`,
                  icon: <Receipt size={16} />,
                },
                { key: "cash" as const, label: "Cash", icon: <IndianRupee size={16} /> },
                {
                  key: "credit" as const,
                  label: "Store Credit",
                  icon: <CreditCard size={16} />,
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRefundMethod(opt.key)}
                style={{
                  padding: "10px 8px",
                  border:
                    refundMethod === opt.key
                      ? "2px solid #7F77DD"
                      : "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  background:
                    refundMethod === opt.key
                      ? "#EEEDFE"
                      : "var(--color-background-primary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color:
                    refundMethod === opt.key
                      ? "#534AB7"
                      : "var(--color-text-secondary)",
                }}
              >
                <span
                  style={{
                    color:
                      refundMethod === opt.key
                        ? "#534AB7"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
            Reason for Return
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                style={{
                  padding: "5px 12px",
                  border:
                    reason === r
                      ? "2px solid #7F77DD"
                      : "0.5px solid var(--color-border-secondary)",
                  borderRadius: 20,
                  background: reason === r ? "#EEEDFE" : "transparent",
                  color: reason === r ? "#534AB7" : "var(--color-text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRefundConfirm}
          disabled={!reason || isRefunding}
          style={{
            width: "100%",
            padding: "13px",
            background:
              reason && !isRefunding
                ? "#7F77DD"
                : "var(--color-background-secondary)",
            color:
              reason && !isRefunding ? "white" : "var(--color-text-secondary)",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            fontSize: 14,
            fontWeight: 600,
            cursor: reason && !isRefunding ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          {isRefunding
            ? "Processing…"
            : `Process Refund • ${fmt(refundTotal)}`}
        </button>
      </div>
    );
  }

  // ── Step: select ────────────────────────────────────────────────────────────
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontWeight: 500, fontSize: 15 }}>Select Items to Return</div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginTop: 2,
            }}
          >
            {invoice.invoiceNo} • {invoice.customer.name}
          </div>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-secondary)",
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter items..."
          style={{
            width: "100%",
            paddingLeft: 36,
            paddingRight: 12,
            height: 36,
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: 280,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {filteredItems.map((item) => {
          const selected = refundItems.find((r) => r.id === item.id);
          return (
            <div
              key={item.id}
              style={{
                border: selected
                  ? "2px solid #7F77DD"
                  : "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                padding: "10px 12px",
                background: selected
                  ? "#EEEDFE"
                  : "var(--color-background-primary)",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onClick={() => toggleItem(item)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 13,
                      color: selected ? "#3C3489" : "var(--color-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginRight: 8,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: selected ? "#534AB7" : "var(--color-text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    {item.sku} • Purchased qty: {item.qty} • {fmt(item.unitPrice)}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: selected ? "#534AB7" : "var(--color-text-primary)",
                    }}
                  >
                    {fmt(item.total)}
                  </div>
                </div>
              </div>
              {selected && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "0.5px solid #AFA9EC",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    style={{ fontSize: 12, color: "#534AB7", fontWeight: 500 }}
                  >
                    Return qty:
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "0.5px solid #7F77DD",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      style={{
                        padding: "4px 10px",
                        background: "#EEEDFE",
                        border: "none",
                        cursor: "pointer",
                        color: "#534AB7",
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span
                      style={{
                        padding: "4px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#3C3489",
                      }}
                    >
                      {selected.refundQty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      style={{
                        padding: "4px 10px",
                        background: "#EEEDFE",
                        border: "none",
                        cursor: "pointer",
                        color: "#534AB7",
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: "#534AB7" }}>
                    = {fmt(item.unitPrice * selected.refundQty)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {refundItems.length > 0 && (
        <div
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "12px 14px",
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {refundItems.length} item{refundItems.length > 1 ? "s" : ""} selected
            for return
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#7F77DD" }}>
            {fmt(refundTotal)}
          </div>
        </div>
      )}

      <button
        onClick={() => setStep("confirm")}
        disabled={refundItems.length === 0}
        style={{
          width: "100%",
          padding: "13px",
          background:
            refundItems.length > 0 ? "#7F77DD" : "var(--color-background-secondary)",
          color:
            refundItems.length > 0 ? "white" : "var(--color-text-secondary)",
          border: "none",
          borderRadius: "var(--border-radius-md)",
          fontSize: 14,
          fontWeight: 600,
          cursor: refundItems.length > 0 ? "pointer" : "not-allowed",
        }}
      >
        Continue to Confirm
      </button>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function POSInvoiceSystem({ invoice }: POSInvoiceSystemProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "payment-done" | "invoice-preview" | "refund"
  >("payment-done");
  const [printMode, setPrintMode] = useState<"thermal" | "a4">("thermal");

  const tabs = [
    { id: "payment-done" as const, label: "Payment Complete", icon: <CheckCircle size={15} /> },
    { id: "invoice-preview" as const, label: "Invoice Preview", icon: <FileText size={15} /> },
    { id: "refund" as const, label: "Refund", icon: <RotateCcw size={15} /> },
  ];

  const handlePrint = () => window.print();

  const handleDownload = () => {
    // In a real app, trigger PDF download here (e.g. html2pdf or server-side)
    toast.info("PDF download coming soon.");
  };

  return (
    <div style={{ padding: "1rem 0" }}>
      <h2 className="sr-only">POS Invoice and Refund System</h2>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          background: "var(--color-background-secondary)",
          padding: 4,
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border:
                activeTab === tab.id
                  ? "0.5px solid var(--color-border-secondary)"
                  : "none",
              borderRadius: "var(--border-radius-md)",
              background:
                activeTab === tab.id
                  ? "var(--color-background-primary)"
                  : "transparent",
              color:
                activeTab === tab.id
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 500 : 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "all 0.1s",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Payment Done ─────────────────────────────────────────────────── */}
      {activeTab === "payment-done" && (
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingBottom: 20,
              marginBottom: 20,
              borderBottom: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--color-background-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <CheckCircle size={32} color="var(--color-text-success)" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>Payment Successful</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#7F77DD",
                marginTop: 4,
              }}
            >
              {fmt(toNum(invoice.grandTotal))}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                marginTop: 6,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <span>{invoice.invoiceNo}</span>
              <span>•</span>
              <span>{invoice.customer.name}</span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {invoice.paymentMethod === "UPI" ? (
                  <Wallet size={13} />
                ) : invoice.paymentMethod === "Card" ? (
                  <CreditCard size={13} />
                ) : (
                  <IndianRupee size={13} />
                )}
                {invoice.paymentMethod}
              </span>
            </div>
            {invoice.change > 0 && (
              <div
                style={{
                  marginTop: 10,
                  background: "var(--color-background-success)",
                  borderRadius: "var(--border-radius-md)",
                  padding: "6px 16px",
                  fontSize: 13,
                  color: "var(--color-text-success)",
                  fontWeight: 500,
                }}
              >
                Change to return: {fmt(invoice.change)}
              </div>
            )}
          </div>

          {/* Print mode toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500 }}>Print Receipt</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["thermal", "a4"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPrintMode(m)}
                  style={{
                    padding: "5px 14px",
                    border:
                      printMode === m
                        ? "2px solid #7F77DD"
                        : "0.5px solid var(--color-border-secondary)",
                    borderRadius: 20,
                    background: printMode === m ? "#EEEDFE" : "transparent",
                    color: printMode === m ? "#534AB7" : "var(--color-text-secondary)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: printMode === m ? 500 : 400,
                  }}
                >
                  {m === "thermal" ? "Thermal" : "A4"}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt preview */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
              overflowX: "auto",
            }}
          >
            {printMode === "thermal" ? (
              <ThermalReceipt invoice={invoice} />
            ) : (
              <div
                style={{
                  width: "100%",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-lg)",
                  overflow: "hidden",
                }}
              >
                <A4Invoice invoice={invoice} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: "11px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                padding: "11px",
                background: "#7F77DD",
                border: "none",
                borderRadius: "var(--border-radius-md)",
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={() => setActiveTab("refund")}
              style={{
                flex: 1,
                padding: "11px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <RotateCcw size={15} /> Refund
            </button>
          </div>

          {/* New transaction */}
          <button
            onClick={() => router.push("/sales/pos")}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "11px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <Receipt size={15} /> New Transaction
          </button>
        </div>
      )}

      {/* ── Invoice Preview ───────────────────────────────────────────────── */}
      {activeTab === "invoice-preview" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: "8px 16px",
                background: "#7F77DD",
                border: "none",
                borderRadius: "var(--border-radius-md)",
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Printer size={14} /> Print A4
            </button>
          </div>
          <div
            style={{
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-lg)",
              overflow: "hidden",
            }}
          >
            <A4Invoice invoice={invoice} />
          </div>
        </div>
      )}

      {/* ── Refund ───────────────────────────────────────────────────────── */}
      {activeTab === "refund" && (
        <RefundScreen
          invoice={invoice}
          onClose={() => setActiveTab("payment-done")}
          onComplete={() => router.push("/sales/pos")}
        />
      )}
    </div>
  );
}