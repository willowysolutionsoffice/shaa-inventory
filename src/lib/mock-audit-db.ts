export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "PAYMENT"
  | "STOCK_ADJUST";

export type AuditModule =
  | "Purchase"
  | "Sale"
  | "Product"
  | "Customer"
  | "Supplier"
  | "Expense"
  | "User"
  | "Role"
  | "Branch"
  | "Stock"
  | "Return";

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: AuditModule;
  entityId: string;
  entityLabel: string;
  description: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  branchId: string;
  branchName: string;
  ipAddress?: string;
}

export type ActivityType =
  | "LOGIN"
  | "LOGOUT"
  | "PAGE_VIEW"
  | "EXPORT"
  | "PRINT"
  | "SEARCH"
  | "FILTER"
  | "REPORT";

export interface ActivityLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  activityType: ActivityType;
  description: string;
  page?: string;
  meta?: Record<string, unknown>;
  branchId: string;
  branchName: string;
  ipAddress?: string;
  sessionId?: string;
}

const now = Date.now();
const mins = (m: number) => now - m * 60 * 1000;
const hrs  = (h: number) => now - h * 60 * 60 * 1000;
const days = (d: number) => now - d * 24 * 60 * 60 * 1000;

const globalStore = globalThis as unknown as {
  auditDb: {
    auditLogs: AuditLog[];
    activityLogs: ActivityLog[];
  };
};

if (!globalStore.auditDb) {
  globalStore.auditDb = {

    auditLogs: [
      {
        id: "aud-1",
        timestamp: new Date(mins(5)),
        userId: "user-suresh",
        userName: "Suresh Nair",
        userRole: "purchase_manager",
        action: "CREATE",
        module: "Purchase",
        entityId: "pur-1",
        entityLabel: "PO-2026-0011",
        description: "Created new purchase order from Gulaal Pakistan for ₹76,800",
        after: { purchaseNo: "PO-2026-0011", supplier: "Gulaal Pakistan – India Distributor", totalAmount: 76800, status: "Received", paymentStatus: "paid" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.12",
      },
      {
        id: "aud-2",
        timestamp: new Date(mins(22)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        action: "STATUS_CHANGE",
        module: "Purchase",
        entityId: "pur-2",
        entityLabel: "PO-2026-0012",
        description: "Changed purchase status from Pending → Received",
        before: { status: "Pending" },
        after: { status: "Received" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.10",
      },
      {
        id: "aud-3",
        timestamp: new Date(hrs(1)),
        userId: "user-reshma",
        userName: "Reshma Abdul Razak",
        userRole: "billing_staff",
        action: "CREATE",
        module: "Sale",
        entityId: "sale-1",
        entityLabel: "SHAA-2026-0041",
        description: "Created sale invoice for Fathima Beevi K — ₹9,998 (Paid via UPI)",
        after: { invoiceNo: "SHAA-2026-0041", customer: "Fathima Beevi K", grandTotal: 9998, paymentStatus: "paid" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.15",
      },
      {
        id: "aud-4",
        timestamp: new Date(hrs(2)),
        userId: "user-reshma",
        userName: "Reshma Abdul Razak",
        userRole: "billing_staff",
        action: "PAYMENT",
        module: "Sale",
        entityId: "sale-2",
        entityLabel: "SHAA-2026-0042",
        description: "Recorded partial payment ₹5,998 (Cash) for Zainab Hussain. Due: ₹500",
        after: { paidAmount: 5998, dueAmount: 500, paymentMethod: "Cash" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.15",
      },
      {
        id: "aud-5",
        timestamp: new Date(hrs(3)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        action: "UPDATE",
        module: "Product",
        entityId: "prod-1",
        entityLabel: "Gulaal Delia Lawn – Unstitched 3-Piece",
        description: "Updated selling price from ₹4,799 → ₹4,999",
        before: { sellingPrice: 4799 },
        after: { sellingPrice: 4999 },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.10",
      },
      {
        id: "aud-6",
        timestamp: new Date(hrs(5)),
        userId: "user-suresh",
        userName: "Suresh Nair",
        userRole: "purchase_manager",
        action: "STOCK_ADJUST",
        module: "Stock",
        entityId: "prod-3",
        entityLabel: "Sapphire Eid Festive Unstitched – Embroidered",
        description: "Stock adjusted: +5 units added (Damaged stock replacement)",
        before: { stock: 10 },
        after: { stock: 15 },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.12",
      },
      {
        id: "aud-7",
        timestamp: new Date(days(1)),
        userId: "user-faisal",
        userName: "Faisal Ibrahim",
        userRole: "store_manager",
        action: "CREATE",
        module: "Customer",
        entityId: "cust-5",
        entityLabel: "Reshma Abdul Razak",
        description: "Registered new customer — Tirur branch",
        after: { name: "Reshma Abdul Razak", phone: "9656567890", branch: "Shaa Tirur" },
        branchId: "branch-tirur",
        branchName: "Shaa Tirur",
        ipAddress: "192.168.2.11",
      },
      {
        id: "aud-8",
        timestamp: new Date(days(1) + hrs(2)),
        userId: "user-priya",
        userName: "Priya Krishnan",
        userRole: "accountant",
        action: "CREATE",
        module: "Expense",
        entityId: "exp-1",
        entityLabel: "Mavoor Road Store Rent – May 2026",
        description: "Logged expense ₹45,000 — Rent & Utilities category",
        after: { title: "Mavoor Road Store Rent – May 2026", amount: 45000, category: "Rent & Utilities" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.18",
      },
      {
        id: "aud-9",
        timestamp: new Date(days(2)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        action: "CREATE",
        module: "Supplier",
        entityId: "sup-4",
        entityLabel: "Sapphire Fashion – Kerala Distributor",
        description: "Added new supplier — Sapphire Fashion with opening balance ₹8,000",
        after: { name: "Sapphire Fashion – Kerala Distributor", openingBalance: 8000, branch: "Shaa Malappuram" },
        branchId: "branch-malappuram",
        branchName: "Shaa Malappuram",
        ipAddress: "192.168.1.10",
      },
      {
        id: "aud-10",
        timestamp: new Date(days(2) + hrs(3)),
        userId: "user-faisal",
        userName: "Faisal Ibrahim",
        userRole: "store_manager",
        action: "DELETE",
        module: "Sale",
        entityId: "sale-old-1",
        entityLabel: "SHAA-2026-0038",
        description: "Deleted draft sale invoice — no items added",
        before: { invoiceNo: "SHAA-2026-0038", grandTotal: 0, status: "Draft" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.11",
      },
      {
        id: "aud-11",
        timestamp: new Date(days(3)),
        userId: "user-reshma",
        userName: "Reshma Abdul Razak",
        userRole: "billing_staff",
        action: "CREATE",
        module: "Return",
        entityId: "sret-1",
        entityLabel: "SR-2026-001",
        description: "Processed sales return from Zainab Hussain — ₹6,999 (Sapphire Eid Suit)",
        after: { returnNo: "SR-2026-001", customer: "Zainab Hussain", grandTotal: 6999 },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.15",
      },
      {
        id: "aud-12",
        timestamp: new Date(days(3) + hrs(1)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        action: "UPDATE",
        module: "Role",
        entityId: "role-accountant",
        entityLabel: "Accountant",
        description: "Added permission manage_purchases to Accountant role",
        before: { permissions: ["view_dashboard", "view_reports", "manage_expenses", "manage_sales"] },
        after: { permissions: ["view_dashboard", "view_reports", "manage_expenses", "manage_sales", "manage_purchases"] },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.10",
      },
    ],

    activityLogs: [
      {
        id: "act-1",
        timestamp: new Date(mins(2)),
        userId: "user-reshma",
        userName: "Reshma Abdul Razak",
        userRole: "billing_staff",
        activityType: "PAGE_VIEW",
        description: "Visited POS Billing Terminal",
        page: "/sales/pos",
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.15",
        sessionId: "sess-reshma-001",
      },
      {
        id: "act-2",
        timestamp: new Date(mins(8)),
        userId: "user-suresh",
        userName: "Suresh Nair",
        userRole: "purchase_manager",
        activityType: "PAGE_VIEW",
        description: "Opened Add Purchase form",
        page: "/purchase/new",
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.12",
        sessionId: "sess-suresh-001",
      },
      {
        id: "act-3",
        timestamp: new Date(mins(15)),
        userId: "user-priya",
        userName: "Priya Krishnan",
        userRole: "accountant",
        activityType: "EXPORT",
        description: "Exported Payment Report PDF — Customer Ledger",
        page: "/reports/payment-reports",
        meta: { format: "PDF", customer: "Zainab Hussain" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.18",
        sessionId: "sess-priya-001",
      },
      {
        id: "act-4",
        timestamp: new Date(mins(30)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        activityType: "PAGE_VIEW",
        description: "Viewed Admin Dashboard",
        page: "/dashboard",
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.10",
        sessionId: "sess-arjun-001",
      },
      {
        id: "act-5",
        timestamp: new Date(hrs(1)),
        userId: "user-faisal",
        userName: "Faisal Ibrahim",
        userRole: "store_manager",
        activityType: "LOGIN",
        description: "Logged in from Tirur branch device",
        branchId: "branch-tirur",
        branchName: "Shaa Tirur",
        ipAddress: "192.168.2.11",
        sessionId: "sess-faisal-001",
      },
      {
        id: "act-6",
        timestamp: new Date(hrs(2)),
        userId: "user-priya",
        userName: "Priya Krishnan",
        userRole: "accountant",
        activityType: "REPORT",
        description: "Generated Profit & Loss Report for May 2026",
        page: "/reports/pnl-reports",
        meta: { from: "2026-05-01", to: "2026-05-31" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.18",
        sessionId: "sess-priya-001",
      },
      {
        id: "act-7",
        timestamp: new Date(hrs(3)),
        userId: "user-reshma",
        userName: "Reshma Abdul Razak",
        userRole: "billing_staff",
        activityType: "PRINT",
        description: "Printed invoice SHAA-2026-0041 for Fathima Beevi K",
        page: "/sales/pos/invoice",
        meta: { invoiceNo: "SHAA-2026-0041" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.15",
        sessionId: "sess-reshma-001",
      },
      {
        id: "act-8",
        timestamp: new Date(hrs(4)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        activityType: "SEARCH",
        description: "Searched products — query: 'Gulaal'",
        page: "/admin/products",
        meta: { query: "Gulaal", resultsCount: 2 },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.10",
        sessionId: "sess-arjun-001",
      },
      {
        id: "act-9",
        timestamp: new Date(days(1)),
        userId: "user-suresh",
        userName: "Suresh Nair",
        userRole: "purchase_manager",
        activityType: "EXPORT",
        description: "Exported Purchase List PDF for June 2026",
        page: "/purchase",
        meta: { format: "PDF", month: "June 2026" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.12",
        sessionId: "sess-suresh-001",
      },
      {
        id: "act-10",
        timestamp: new Date(days(1) + hrs(5)),
        userId: "user-faisal",
        userName: "Faisal Ibrahim",
        userRole: "store_manager",
        activityType: "LOGOUT",
        description: "Logged out after 4h 32m session",
        branchId: "branch-tirur",
        branchName: "Shaa Tirur",
        ipAddress: "192.168.2.11",
        sessionId: "sess-faisal-001",
      },
      {
        id: "act-11",
        timestamp: new Date(days(2)),
        userId: "user-priya",
        userName: "Priya Krishnan",
        userRole: "accountant",
        activityType: "LOGIN",
        description: "Logged in — Calicut main store",
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.18",
        sessionId: "sess-priya-002",
      },
      {
        id: "act-12",
        timestamp: new Date(days(2) + hrs(2)),
        userId: "user-arjun",
        userName: "Arjun Menon",
        userRole: "admin",
        activityType: "FILTER",
        description: "Filtered purchase list by date range: Jun 01–Jun 06",
        page: "/purchase",
        meta: { from: "2026-06-01", to: "2026-06-06" },
        branchId: "branch-calicut",
        branchName: "Shaa Calicut – Main Store",
        ipAddress: "192.168.1.10",
        sessionId: "sess-arjun-001",
      },
    ],
  };
}

export const auditDb = globalStore.auditDb;