# Architecture Analysis & POS Deep Audit: SHAA Inventory System

**Target Deployment**: Retail Multi-Branch POS & ERP (Shaa Shopy, Hilite Mall, Calicut)  
**Analysis Date**: October 2026  
**Audit Scope**: Frontend (`shaa-inventory`), Backend API (`shaa-backend`), Database & Prisma ORM Schema, POS Billing & Hardware Integration  
**Objective**: Evaluate current architecture against high-speed, keyboard-first retail billing requirements (Excel/Zoho POS style).

---

## 1. Project Overview

### 1.1 Languages, Runtimes & Frameworks

| Component | Technology | Version | Purpose / Role |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `^16.0.8` (`package.json:45`) | Server & Client Components, Route Handlers, Server Actions |
| **Frontend Runtime / UI** | React / React DOM | `^19.0.0` (`package.json:51,54`) | Core UI rendering engine |
| **Frontend Language** | TypeScript | `^5.0.0` (`package.json:78`) | Type safety & compilation |
| **Frontend Styling** | Tailwind CSS / PostCSS | `^4.0.0` (`package.json:66,75`) | Utility-first CSS architecture with CSS variables |
| **UI Component Primitives** | Radix UI | Various (`package.json:14-28`) | Headless accessibility primitives (Dialog, Select, Popover, etc.) |
| **Client Form Management** | React Hook Form + Zod | `^7.59.0` / `^3.25.67` (`package.json:55,62`) | Form state, dynamic field arrays, and schema validation |
| **Server Action Framework** | `next-safe-action` | `^8.0.7` (`package.json:46`) | Type-safe server actions wrapper |
| **Data Tables** | TanStack Table | `^8.21.3` (`package.json:30`) | Headless data tables with pagination and sorting |
| **Barcode & Thermal Print** | `qz-tray` / `jsbarcode` | `^2.2.6` / `^3.12.3` (`package.json:40,50`) | Direct thermal printing & barcode rendering |
| **PDF Generation** | `jspdf` / `html2canvas-pro` | `^3.0.4` / `^2.0.4` (`package.json:37,41`) | A4 invoice rasterization and PDF generation |
| **Backend Runtime** | Node.js + Express | `^5.2.1` (`shaa-backend/package.json:19`) | RESTful API server |
| **Backend Language** | TypeScript | `^5.7.3` (`shaa-backend/package.json:34`) | Compiled via `ts-node-dev` and `tsc` |
| **ORM & Database Client** | Prisma ORM | `^5.22.0` (`shaa-backend/package.json:16,24`) | Data access, migrations, schema modeling |
| **Backend Security & Auth** | `jsonwebtoken` / `bcryptjs` | `^9.0.3` / `^3.0.3` (`shaa-backend/package.json:17,21`) | Dual-token authentication (Access JWT + Refresh Token) |

### 1.2 Directory Structure & Purpose (3-Level Depth)

```
shaa-inventory/ (Frontend)
├── public/                     # Static assets and certificates
│   └── qz/                     # Digital certificates for QZ Tray printing
├── src/
│   ├── actions/                # Server Actions (`next-safe-action`) calling backend REST APIs
│   │   ├── auth.ts             # Auth session, login, and cookie persistence
│   │   ├── sales-action.ts     # Sales create, update, fetch, delete server actions
│   │   ├── product-actions.ts  # Product listing, dropdown queries, CRUD actions
│   │   ├── branch-action.ts    # Branch dropdowns and management actions
│   │   └── customer-action.ts  # Customer ledger and dropdown actions
│   ├── app/                    # Next.js App Router root
│   │   ├── (auth)/             # Authentication route group (Login)
│   │   ├── (sidebar)/          # Main dashboard & business application layout
│   │   │   ├── admin/          # Backoffice masters (Products, Branches, GRN, Stock Transfer)
│   │   │   ├── dashboard/      # Executive KPIs and revenue statistics
│   │   │   ├── reports/        # Sales, P&L, GST, and ledger reports
│   │   │   └── sales/          # POS billing (`/sales/pos`) and Invoice management
│   │   └── api/                # Next.js route handlers proxying backend APIs
│   ├── components/             # Reusable UI components
│   │   ├── sales/              # POS billing, thermal invoice system, edit dialogs
│   │   ├── products/           # Product tables, QR/barcode generators, forms
│   │   ├── ui/                 # Atomic design system components (Radix + Tailwind)
│   │   └── layout/             # Sidebar, Header, Breadcrumbs, Theme Toggle
│   ├── constants/              # Navigation schemas and static configuration
│   ├── hooks/                  # Custom React hooks (keyboard shortcuts, debounce, media queries)
│   ├── lib/                    # Core utilities (API client, Date formatters, Thermal printing)
│   │   ├── api.ts              # Fetch wrapper injecting Bearer tokens and error normalization
│   │   ├── safeAction.ts       # Base client for `next-safe-action`
│   │   └── thermal-print.ts    # QZ Tray WebSocket client & HTML receipt builder
│   ├── schemas/                # Zod schemas shared across forms and actions
│   └── types/                  # TypeScript interface declarations

shaa-backend/ (Backend API)
├── prisma/
│   ├── schema.prisma           # Complete database schema, relations, enums, indexes
│   └── seed.ts                 # Database seeding script for default roles & admin
├── src/
│   ├── config/                 # Prisma client instance and environment configuration
│   ├── constants/              # System-wide permissions dictionary (`permissions.ts`)
│   ├── controllers/            # Express request handlers & HTTP response status classification
│   ├── middlewares/            # JWT authentication (`authMiddleware`) & RBAC guards (`requirePermission`)
│   ├── routes/                 # Express Router endpoint definitions
│   ├── services/               # Core business logic, Prisma queries, and transaction pipelines
│   └── utils/                  # Password hashing (`bcrypt`), JWT sign/verify, and crypto helpers
```

### 1.3 Environment Variable Names Catalog

#### Frontend (`shaa-inventory`)
- `NEXT_PUBLIC_API_URL` (Frontend client-side base URL for backend API / QZ signing endpoint)
- `API_URL` (Server-side Next.js runtime backend API base URL)
- `JWT_ACCESS_SECRET` (Frontend token verification secret fallback)

#### Backend (`shaa-backend`)
- `DATABASE_URL` (PostgreSQL / MySQL database connection string with pool configuration)
- `JWT_ACCESS_SECRET` (Secret key for signing short-lived access JWT tokens)
- `JWT_REFRESH_SECRET` (Secret key for signing long-lived refresh JWT tokens)
- `PORT` (Express HTTP server listening port)
- `NODE_ENV` (`development` | `production`)
- `FRONTEND_URL` (CORS allowed origin list for browser clients)

---

## 2. Data Model & Schema Deep-Dive

### 2.1 Database Entities & Field Constraints

The data layer is modeled in `shaa-backend/prisma/schema.prisma` (`schema.prisma:1-480`).

```
                              ┌────────────────────────┐
                              │         Branch         │
                              └───────────┬────────────┘
                                          │ 1
                                          │
                  ┌───────────────────────┼────────────────────────┐
                  │ *                     │ *                      │ *
        ┌─────────▼────────┐    ┌─────────▼────────┐     ┌─────────▼────────┐
        │       User       │    │     Customer     │     │     Supplier     │
        └─────────┬────────┘    └─────────┬────────┘     └─────────┬────────┘
                  │ 1 (Salesman)          │ 1                      │ 1
                  │                       │                        │
                  │ *                     │ *                      │ *
        ┌─────────▼───────────────────────▼────────┐     ┌─────────▼────────┐
        │                   Sale                   │     │     Purchase     │
        └─────────────────┬────────────────────────┘     └─────────┬────────┘
                          │ 1                                      │ 1
                          │                                        │
             ┌────────────┴────────────┐                           │
             │ *                       │ *                         │ *
   ┌─────────▼────────┐      ┌─────────▼────────┐        ┌─────────▼────────┐
   │     SaleItem     │      │   SalesPayment   │        │   PurchaseItem   │
   └─────────┬────────┘      └──────────────────┘        └─────────┬────────┘
             │ *                                                   │ *
             │                                                     │
             │                         ┌────────────────────────┐  │
             └────────────────────────►│        Product         │◄─┘
                                       └───────────┬────────────┘
                                                   │ 1
                                                   │ *
                                       ┌───────────▼────────────┐
                                       │     ProductVariant     │
                                       └────────────────────────┘
```

#### Core Table Definitions & Types:

1. **`Branch`** (`schema.prisma:86-105`):
   - `id`: `String @id @default(uuid())`
   - `name`: `String`
   - `phone`, `email`, `address`: `String?`
   - Relations: `users`, `products`, `sales`, `purchases`, `customers`, `expenses`, `stockTransfersFrom`, `stockTransfersTo`.

2. **`Product`** (`schema.prisma:163-196`):
   - `id`: `String @id @default(uuid())`
   - `productName`: `String`, `sku`: `String @unique`, `unit`: `String @default("pcs")`
   - `stock`: `Int @default(0)` (Single aggregate stock per product; branch stock is partitioned by branchId on the product record).
   - `purchasePrice`: `Decimal @db.Decimal(12, 2)`, `sellingPrice`: `Decimal @db.Decimal(12, 2)`
   - `hsl`: `String?` (Harmonized System of Nomenclature / HSN Code alias)
   - `brandId`, `subBrandId`, `categoryId`, `branchId`: Foreign Keys.

3. **`Sale`** (`schema.prisma:243-273`):
   - `id`: `String @id @default(uuid())`, `invoiceNo`: `String @unique`
   - `salesDate`: `DateTime`, `customerId`: `String`, `branchId`: `String`, `salesmanId`: `String?`
   - `grandTotal`: `Decimal @db.Decimal(12, 2)`
   - `paymentStatus`: `PaymentStatus @default(PENDING)` (`PENDING` | `PARTIAL` | `PAID`)
   - `paymentDue`: `Decimal @default(0) @db.Decimal(12, 2)`
   - `discountAmount`: `Decimal @default(0) @db.Decimal(12, 2)`

4. **`SaleItem`** (`schema.prisma:275-291`):
   - `id`: `String @id @default(uuid())`, `saleId`: `String` (Cascade delete on Sale removal)
   - `productId`: `String`, `variantId`: `String?`
   - `quantity`: `Int`, `unitPrice`: `Decimal @db.Decimal(12, 2)`
   - `discount`: `Decimal @default(0) @db.Decimal(12, 2)`
   - `subtotal`: `Decimal @db.Decimal(12, 2)`, `total`: `Decimal @db.Decimal(12, 2)`
   - `purchasePrice`: `Decimal @db.Decimal(12, 2)` (COGS tracking for profit computation)

5. **`SalesPayment`** (`schema.prisma:293-305`):
   - `id`: `String @id @default(uuid())`, `saleId`: `String`
   - `amount`: `Decimal @db.Decimal(12, 2)`, `paidOn`: `DateTime`
   - `paymentMethod`: `PaymentMethod` (`CASH` | `CARD` | `UPI` | `CHEQUE` | `BANK_TRANSFER` | `OTHER`)
   - `paymentNote`: `String?`, `dueDate`: `DateTime?`

6. **`Customer`** (`schema.prisma:222-237`):
   - `id`: `String @id @default(uuid())`, `name`: `String`, `phone`: `String?`, `email`: `String?`
   - `openingBalance`: `Decimal @default(0) @db.Decimal(12, 2)` (Stores cumulative credit/due balance)
   - `branchId`: `String`

7. **`SalesReturn` & `SalesReturnItem`** (`schema.prisma:364-398`):
   - `id`: `String @id @default(uuid())`, `returnNo`: `String @unique`, `saleId`: `String`
   - `refundMethod`: `RefundMethod @default(ORIGINAL)` (`ORIGINAL` | `CASH` | `STORE_CREDIT` | `EXCHANGE`)
   - `grandTotal`: `Decimal @db.Decimal(12, 2)`

### 2.2 Branch Isolation & Multi-Branch Mechanics
- Multi-branching is enforced via a mandatory foreign key `branchId` on `Product`, `Sale`, `Purchase`, `Customer`, `User`, `Expense`, and `GRN`.
- **Limitation**: The `Product` model contains a direct `stock` column tied to a single `branchId`. Multi-branch inventory is implemented by creating separate `Product` records per branch rather than a dedicated `ProductStock` junction table (`productId` + `branchId` + `stock`).
- Inter-branch transfers are modeled via `StockTransfer` (`schema.prisma:45-63`) with `fromBranchId`, `toBranchId`, and `StockTransferStatus` (`PENDING` | `COMPLETED`).

### 2.3 Soft-Delete & Audit Trail Patterns
- **Soft Delete**: Not implemented globally. Tables (`Product`, `Sale`, `Customer`, `Supplier`) use physical hard deletion via `prisma.<model>.delete()` with cascade triggers (`onDelete: Cascade` on line items).
- **Audit Logging**: A dedicated `mock-audit-db.ts` file exists on the frontend, but the Prisma schema contains no database `AuditLog` table for mutation tracking. Timestamps are limited to `createdAt` and `updatedAt`.

---

## 3. Backend REST API Audit

All routes in `shaa-backend/src/routes/*` are protected via `authMiddleware` and `requirePermission('<permission_key>')` guards.

| Route / Endpoint | HTTP Method | Business Purpose | Permissions Guard | Implementation Status | Source File Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Authenticate user & issue Access/Refresh tokens | Public | ✅ Complete | `src/routes/auth.routes.ts:11` |
| `/auth/refresh` | `POST` | Rotate refresh token & issue new JWT pair | Public | ✅ Complete | `src/routes/auth.routes.ts:13` |
| `/auth/me` | `GET` | Get authenticated user profile & permissions | `authMiddleware` | ✅ Complete | `src/routes/auth.routes.ts:14` |
| `/sales` | `POST` | Create sale bill, deduct stock, update customer balance | `manage_sales` | ✅ Complete | `src/routes/sale.routes.ts:16` |
| `/sales` | `GET` | Paginated sale listing with date/branch/salesman filters | `manage_sales` | ✅ Complete | `src/routes/sale.routes.ts:17` |
| `/sales/:id` | `GET` | Retrieve complete sale invoice with items & payments | `manage_sales` | ✅ Complete | `src/routes/sale.routes.ts:18` |
| `/sales/:id` | `PATCH` | Update sale items, prices, discounts, and payment splits | `manage_sales` | ✅ Complete | `src/routes/sale.routes.ts:19` |
| `/sales/:id/status` | `PATCH` | Transition order status (`Ordered` -> `Dispatched`) | `manage_sales` | ✅ Complete | `src/routes/sale.routes.ts:20` |
| `/sales/:id` | `DELETE` | Delete sale bill, revert stock & adjust customer due | `manage_sales` | ✅ Complete | `src/routes/sale.routes.ts:21` |
| `/sales-returns` | `POST` | Process sale return, increment stock, adjust ledger | `manage_sales` | ✅ Complete | `src/routes/sales-return.routes.ts:15` |
| `/sales-returns` | `GET` | List sales returns with filtering | `manage_sales` | ✅ Complete | `src/routes/sales-return.routes.ts:16` |
| `/sales-returns/:id` | `GET` | Get sales return details | `manage_sales` | ✅ Complete | `src/routes/sales-return.routes.ts:17` |
| `/products` | `GET` | List products with pagination & search | `manage_products` | ✅ Complete | `src/routes/product.routes.ts:18` |
| `/products/dropdown` | `GET` | Lightweight product search for billing & select inputs | `manage_products` | ✅ Complete | `src/routes/product.routes.ts:16` |
| `/products` | `POST` | Create new product catalog item | `manage_products` | ✅ Complete | `src/routes/product.routes.ts:17` |
| `/products/:id` | `PATCH` | Update product master metadata | `manage_products` | ✅ Complete | `src/routes/product.routes.ts:20` |
| `/stock/product/:productId` | `PATCH` | Direct stock quantity adjustment | `manage_products` | ✅ Complete | `src/routes/stock.routes.ts:17` |
| `/stock-transfers` | `POST` | Initiate inter-branch stock transfer | `manage_stock` | 🟡 Partial | `src/routes/stock-transfer.routes.ts:15` |
| `/stock-transfers/:id/cancel`| `PATCH` | Cancel pending transfer and revert stock | `manage_stock` | 🟡 Partial | `src/routes/stock-transfer.routes.ts:18` |
| `/purchases` | `POST` | Create supplier purchase record | `manage_purchases` | ✅ Complete | `src/routes/purchase.routes.ts:14` |
| `/customers` | `GET` | List customers with credit balance tracking | `manage_customers` | ✅ Complete | `src/routes/customer.routes.ts:15` |
| `/customers/dropdown` | `GET` | Fast dropdown customer query | `manage_customers` | ✅ Complete | `src/routes/customer.routes.ts:14` |
| `/reports/sales` | `GET` | Date-filtered sales ledger & tax summaries | `view_reports` | ✅ Complete | `src/routes/reports.routes.ts:11` |
| `/reports/profit-loss` | `GET` | Real-time P&L analytics (Revenue - COGS - Expenses) | `view_reports` | ✅ Complete | `src/routes/reports.routes.ts:12` |
| `/reports/gst` | `GET` | GST B2B/B2C tax breakdown | `view_reports` | 🟡 Partial | `src/routes/reports.routes.ts:14` |
| `/coupons/validate` | `POST` | Validate promotional coupon code and minimum spend | `use_coupons` | ✅ Complete | `src/routes/coupon.routes.ts:18` |

### 3.1 Business Logic & Transaction Handling
- **Database Atomicity (`$transaction`)**:
  - `createSaleService` (`shaa-backend/src/services/sales.service.ts:35-85`): Uses `prisma.$transaction` to ensure `Sale` creation, `SaleItem` inserts, `SalesPayment` inserts, `Product.stock` decrements (if `status === 'Dispatched'`), and `Customer.openingBalance` increments (if `dueAmount > 0`) execute atomically.
  - `updateSaleService` (`shaa-backend/src/services/sales.service.ts:120-195`): Reverts previous product stock increments before applying newly updated quantities. Computes `delta = dueAmount - oldDue` and adjusts customer opening balance.
- **Concurrency & Stock Racing**: Stock decrements use Prisma's atomic increment/decrement (`data: { stock: { decrement: item.quantity } }`). However, there is no pessimistic row-locking (`SELECT ... FOR UPDATE`), meaning concurrent billing on the last stock item can result in negative stock if multiple cashiers checkout simultaneously.

---

## 4. Frontend Route & Component Catalog

### 4.1 Route Completeness

| Route | Purpose | Component Architecture | Status |
| :--- | :--- | :--- | :--- |
| `/sales/pos` | High-speed POS Billing terminal | Client Component (`pos-billing.tsx`) | ✅ Finished (Composition Scheme) |
| `/sales/pos/invoice` | Invoice list, reprint, deletion, and dynamic edit | Client Component (`page.tsx` + `invoice-edit-dialog.tsx`) | ✅ Finished |
| `/sales/pos/invoice/[saleid]` | Thermal receipt & A4 invoice preview / reprint | Server Component + Client (`pos-invoice-system.tsx`) | ✅ Finished |
| `/sales` | Admin sales management & order approval | Client Component with Server Actions (`sales-colums.tsx`) | ✅ Finished |
| `/sales-return` | Sales return and refund processing | Client Component (`sales-return-table.tsx`) | ✅ Finished |
| `/purchase` | Purchase order listing & supplier records | Client Component (`purchase-table.tsx`) | ✅ Finished |
| `/admin/products` | Product master, SKU creation & barcode label print | Client Component (`product-table.tsx` + `product-qr-print.tsx`) | ✅ Finished |
| `/admin/branches` | Branch creation and contact details | Client Component (`branch-table.tsx`) | ✅ Finished |
| `/admin/customers` | Customer master, ledger dues, and contact info | Client Component (`customer-table.tsx`) | ✅ Finished |
| `/admin/stock-transfer` | Branch stock transfer orders | Client Component (`stock-transfer-table.tsx`) | 🟡 Partial |
| `/admin/grn` | Goods Received Notes against purchases | Client Component (`grn-table.tsx`) | 🟡 Partial |
| `/reports/sales-report` | Sales date-range reports with Excel export | Client Component (`page.tsx`) | ✅ Finished |
| `/reports/pnl-reports` | Profit and Loss financial summary | Client Component (`page.tsx`) | ✅ Finished |
| `/admin/accounting/*` | Trial Balance, Balance Sheet, Ledger, GST | Client Components (`page.tsx`) | 🟡 Partial (Mock / Read-only) |
| `/admin/audit` | System audit logs | Client Component | 🔴 Placeholder (Uses `mock-audit-db.ts`) |

---

## 5. POS Billing Screen Deep Audit (Keyboard-First Flow)

Source file: `src/components/sales/pos-billing.tsx` (`pos-billing.tsx:1-2421`).

### 5.1 Grid Layout vs Traditional POS Grid
- **Current Layout**: Two-column layout with left Product Grid / Filter Panel (`pos-billing.tsx:1120-1350`) and right Cart Summary Table (`pos-billing.tsx:1355-1650`).
- **Standard Retail Excel Grid (`Barcode | Item | Qty | Rate | Disc% | Tax | Amount`)**:
  - The cart displays: `#`, `Product Info`, `Qty (+ / -)`, `Rate`, `Disc% / Disc ₹`, `Total`, and `Delete`.
  - It is **not** an in-place editable Excel-style grid where pressing Enter or Tab in a table row advances horizontally from `Barcode -> Qty -> Rate -> Disc -> Next Row`.

### 5.2 Keyboard Navigation & Focus Management
- A linear focus sequence `fieldSequence` is defined (`pos-billing.tsx:480-496`):
  `0: barcodeInput -> 1: searchInput -> 2: categorySelect -> 3: brandSelect -> 4: subBrandSelect -> 5: customerSelect -> 6: salesmanSelect -> 7: invoiceDate -> 8: couponInput -> 9: manualDiscountPercent -> 10: manualDiscountAmount -> 11: checkoutButton`.
- **Focus Retention**: Pressing Enter on barcode scan adds the item to cart and retains focus in `barcodeInputRef` (`pos-billing.tsx:550-580`). However, navigating into cart rows to change specific item quantities requires mouse interaction or tabbing through all header filters.

### 5.3 Barcode Scanning Buffer & Repeat-Scan Handling
- Hardware barcode scanners emulate rapid keystrokes followed by an `Enter` key.
- `pos-billing.tsx` handles this via `<form onSubmit={handleBarcodeSubmit}>` on the barcode input (`pos-billing.tsx:1125-1160`).
- **Repeat-Scan**: Scanning the same SKU repeatedly calls `addToCart(match)` which successfully increments the quantity by 1 without duplicating rows (`pos-billing.tsx:585-610`).
- **Limitation**: The barcode listener is tied to the specific `barcodeInputRef`. If focus is shifted to another element, barcode scans are typed into the active input rather than caught by a global scanner buffer.

### 5.4 Hotkeys & Keyboard Shortcuts Audit

| Shortcut | Target Action | Location in Code | Browser / OS Conflict | Status |
| :--- | :--- | :--- | :--- | :--- |
| `ArrowUp / ArrowDown` | Product grid navigation | `pos-billing.tsx:1070-1095` | None | ✅ Working |
| `Enter` (on product) | Add selected product to cart | `pos-billing.tsx:1096-1105` | None | ✅ Working |
| `Enter` / `Shift+Enter` | Forward/Backward step navigation | `pos-billing.tsx:498-535` | Overrides native form submission | ✅ Working |
| `F1`–`F12` | Function key shortcuts | `pos-billing.tsx` | Native browser actions (F1=Help, F5=Reload, F11=Fullscreen, F12=DevTools) | ❌ **Missing** |
| `Esc` | Clear Cart / Cancel Modal | `pos-billing.tsx` | Native Esc | ❌ **Missing** |
| `Alt+P` / `F8` | Quick Checkout | `pos-billing.tsx` | None | ❌ **Missing** |
| `Hold / Recall Hotkey` | Quick Hold (`F4` / `F6`) | `pos-billing.tsx` | None | ❌ **Missing** |

### 5.5 Hold / Recall & Multi-Bill Tabs
- Supported via `holdBill()` and `restoreBill()` (`pos-billing.tsx:820-865`).
- **Limitation**: Held bills are stored strictly in component React state (`const [heldBills, setHeldBills] = useState<HeldBill[]>([])`). If the cashier refreshes the page, switches tabs, or loses internet connection, all held transactions are cleared.

### 5.6 Discounts & Role-Based Limits
- Line item discount supports both percentage (`discountPercent`) and flat amount (`discountAmount`) (`pos-billing.tsx:90-95`).
- Bill-level discount supports percentage and instant cash deduction (`pos-billing.tsx:104-105`).
- **Limitation**: There is **no maximum discount limit** enforced per role (e.g., Cashier max 10%, Manager max 30%). A cashier can enter a 99% discount without manager approval or override pin.

### 5.7 GST Tax Engine (CGST / SGST / IGST)
- The store header displays: `* We are under composition taxpayer, We are not collecting tax from customer` (`pos-billing.tsx:1785`).
- Line items do not compute CGST / SGST tax splits on POS receipts.
- All product prices are treated as tax-inclusive gross amounts.

### 5.8 Mouse-Free Viability Rating
- **Rating**: **4.5 / 10**
- **Reasoning**: While item scanning and simple checkout can be completed via keyboard, modifying line discounts, deleting specific cart lines, switching payment splits, recalling held bills, and adding new walk-in customer details require mouse clicks.

---

## 6. Financial Settlement, Returns, & Cash Register

### 6.1 Multi-Payment & Split Settlement
- Supports single mode and split mode (`pos-billing.tsx:113-130`).
- Methods: `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`.
- **Change Calculation**: Real-time change return computation (`Math.max(0, totalPaid - grandTotal)`).
- **Customer Due / Credit**: If `totalPaid < grandTotal`, the difference is marked as `dueAmount` and automatically incremented to the customer's ledger (`openingBalance`).

### 6.2 Sales Returns & Exchanges
- Implemented in `src/actions/sales-return-action.ts:15-85` and `shaa-backend/src/services/sales-return.service.ts`.
- Allows selecting original sale invoices, choosing items to return, specifying return reason, and selecting refund method (`CASH`, `ORIGINAL`, `STORE_CREDIT`).
- Decrements customer due balance and increments inventory stock.
- **Limitation**: Direct item-for-item POS exchange during a new billing transaction (scanning an exchange item alongside new items in the same bill) is not supported in a single transaction.

### 6.3 Cash Register & Day-End Settlement
- **Cash Register Open / Close**: ❌ **Not Implemented**.
- **Opening Float / Cash In / Cash Out (Petty Cash)**: ❌ **Not Implemented**.
- **Day-End X-Report / Z-Report (Shift Settlement)**: ❌ **Not Implemented**. Cashiers cannot close shift registers and compare expected drawer cash against physical cash counted.

---

## 7. Printing Subsystem

### 7.1 Thermal Receipt Printing Architecture
- Implementation: `src/lib/thermal-print.ts:1-261`.
- Technology: Direct silent printing via **QZ Tray WebSocket** (`localhost:8182` / `localhost:8183`).
- Fallback: Digital certificate verification via `/qz/digital-certificate.txt` and `/qz/sign`.

### 7.2 Hardware Features Matrix

| Feature | Supported | Implementation Detail / Code Reference |
| :--- | :--- | :--- |
| **80mm Roll Support** | ✅ Yes | Hardcoded `@page { size: 80mm auto; }` in `thermal-print.ts:164` |
| **58mm Roll Support** | ❌ No | No dynamic toggle for 58mm roll width |
| **ESC/POS Raw Mode** | ❌ No | Uses QZ Tray HTML-to-pixel rasterization (`thermal-print.ts:117`) |
| **Paper Auto-Cut Command** | ❌ No | Relies on printer driver automatic cut; no raw cut byte sequence (`\x1D\x56\x41`) |
| **Cash Drawer Kick Pulse**| ❌ No | No drawer kick pulse (`\x1B\x70\x00\x19\xFA`) sent via ESC/POS |
| **Thermal Receipt Logo** | 🟡 Partial | Text header `SHAASHOPY` rendered; no monochrome bitmap header |
| **UPI Payment QR on Bill**| ❌ No | Receipt contains text handle (`shaashopy.hilitemall`), no dynamic dynamic UPI QR |
| **Malayalam / Unicode** | 🟡 Partial | Uses Google Font `Roboto Mono`; rasterized HTML allows glyphs if rendered in browser, but ESC/POS raw Malayalam requires pre-rendered canvas bitmaps |
| **A4 PDF Invoices** | ✅ Yes | Generated via `jspdf` + `html2canvas-pro` (`pos-invoice-system.tsx:849-861`) |
| **Barcode Label Printing**| ✅ Yes | Code-128 barcode labels generated via `jsbarcode` (`product-qr-print.tsx:38-46`) |

---

## 8. Inventory, Purchasing & Reporting Modules

### 8.1 Product Master & Variations
- Products support Brand, Sub-brand, Category, and Variations (`schema.prisma:163-196`).
- Automatic SKU barcode generation using Code-128 format.
- Stock adjustments supported per single product or bulk variants (`src/actions/stock-action.ts`).

### 8.2 Purchases & GRN Workflow
- Complete Purchase creation workflow (`src/app/(sidebar)/purchase/new/page.tsx`).
- Goods Received Notes (GRN) workflow exists (`src/app/(sidebar)/admin/grn/page.tsx`) with status tracking (`DRAFT` -> `VERIFIED`).
- Purchases update supplier balances and add stock to the branch product inventory upon verification.

### 8.3 Reports Engine & Exports
- **Sales Report**: Filterable by Date Range, Branch, and Salesman. Includes total sales revenue, discounts, and payments (`src/app/(sidebar)/reports/sales-report/page.tsx`).
- **Profit & Loss Report**: Calculates Gross Sales, Cost of Goods Sold (COGS from `PurchasePrice`), total discounts, expenses, and net profit margins (`src/app/(sidebar)/reports/pnl-reports/page.tsx`).
- **Exporting**: Table data exports to Excel `.xlsx` format via SheetJS (`xlsx: ^0.18.5`).

---

## 9. Security, RBAC & Technical Debt

### 9.1 Authentication & Token Lifecycle
- Dual JWT architecture:
  - **Access Token**: Signed with `JWT_ACCESS_SECRET`, 15-minute expiration (`shaa-backend/src/utils/jwt.ts`).
  - **Refresh Token**: Signed with `JWT_REFRESH_SECRET`, 30-day expiration, stored in HTTP-only cookies.
  - **Token Rotation & Hashing**: Refresh tokens are stored in the database as SHA-256 hashes (`RefreshToken.tokenHash`), preventing token forgery and enabling instant revocation on logout (`shaa-backend/src/services/auth.service.ts:43-75`).

### 9.2 Permissions Matrix (API vs UI)
- Permissions are strictly enforced on the Express backend via `requirePermission(...)` middleware (`shaa-backend/src/middlewares/auth.middleware.ts:40-70`).
- Permissions include: `manage_sales`, `view_sales`, `manage_products`, `manage_purchases`, `manage_suppliers`, `manage_customers`, `manage_users`, `manage_branches`, `view_reports`, `view_dashboard`, `manage_coupons`, `use_coupons`, `manage_stock`.
- **UI Guarding**: Navigation items and action buttons check user permissions stored in local session state before rendering.

### 9.3 Security Vulnerabilities & Code Quality Audit
1. **No Rate Limiting on POS Endpoints**: While global rate limiters exist on auth routes, `/sales` and `/products/dropdown` lack dedicated per-workstation throttling.
2. **Hardcoded Print Fallbacks**: Fallback thermal printer name defaults to `"Microsoft Print to PDF"` if unconfigured in `localStorage`.
3. **Mock Audit Logs**: The frontend contains a mock database `src/lib/mock-audit-db.ts` used by `/admin/audit/page.tsx` instead of connecting to a real backend audit table.

---

## 10. Gap Analysis Table

| # | Feature / Requirement | Status | Source Files Cited | Technical Findings & Architectural Notes |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Excel-style keyboard billing grid** | ❌ | `src/components/sales/pos-billing.tsx:1355-1650` | Cart is a standard table with button steppers. Arrow-key grid cell traversal (`Barcode -> Qty -> Rate -> Disc`) does not exist. |
| **2** | **Barcode scan + repeat-scan qty** | 🟡 | `src/components/sales/pos-billing.tsx:550-610` | Repeat-scan increments quantity, but scanner listener is only active when `barcodeInputRef` is focused; lacks global scanner buffer. |
| **3** | **Fuzzy item search dropdown** | 🟡 | `src/components/sales/pos-billing.tsx:640-670`, `src/actions/product-actions.ts:145` | Substring match (`includes()`) on Name and SKU is supported; true fuzzy search (Levenshtein / Fuse.js / trigram) is not implemented. |
| **4** | **F-key shortcuts + legend bar** | ❌ | `src/components/sales/pos-billing.tsx:1070-1110` | F1–F12 keys are unmapped. No on-screen hotkey legend bar exists for cashiers. |
| **5** | **Hold/recall + bill tabs** | 🟡 | `src/components/sales/pos-billing.tsx:820-865` | In-memory hold/recall works, but state is lost on page refresh or browser restart (no IndexedDB / DB persistence). |
| **6** | **Item/bill discount with limits** | 🟡 | `src/components/sales/pos-billing.tsx:90-105` | Percent and cash discounts exist, but lacks role-based maximum discount limits or manager approval overrides. |
| **7** | **Split payment** | ✅ | `src/components/sales/pos-billing.tsx:125-130`, `src/lib/thermal-print.ts:29-54` | Full multi-method split payment (Cash + Card + UPI + Bank) with real-time balance and change calculation. |
| **8** | **Cash / Card / UPI / Credit / Store Credit** | 🟡 | `src/components/sales/pos-billing.tsx:113-116`, `schema.prisma:14-20` | Cash, Card, UPI, and Customer Credit (Due) are fully working. Store Credit / Gift vouchers lack dedicated balance tracking. |
| **9** | **Sales return and exchange** | 🟡 | `src/actions/sales-return-action.ts:15-85`, `src/components/sales-return/*` | Standalone Sales Return screen is complete. In-bill POS direct exchange (new items + returned items in one invoice) is missing. |
| **10** | **Cash register + day-end** | ❌ | `shaa-backend/src/services/*`, `src/app/(sidebar)/*` | Cash register opening float, cash in/out petty drops, shift X-Report, and day-end Z-Report settlement are completely missing. |
| **11** | **Thermal printing (58/80mm, ESC/POS)** | 🟡 | `src/lib/thermal-print.ts:100-261` | 80mm QZ Tray HTML printing works. 58mm templates, raw ESC/POS byte mode, paper auto-cut, and cash drawer kick are missing. |
| **12** | **Malayalam receipt support** | 🟡 | `src/lib/thermal-print.ts:160-194` | HTML rasterization displays Unicode if system fonts exist, but raw ESC/POS Malayalam bitmap generation is not implemented. |
| **13** | **Barcode label printing** | ✅ | `src/components/products/product-qr-print.tsx:38-120` | Full 76x100mm label printing with Code-128 barcodes via `jsbarcode`. |
| **14** | **Purchase entry + GRN** | ✅ | `src/app/(sidebar)/purchase/*`, `src/app/(sidebar)/admin/grn/*` | Complete purchase order entry, supplier ledger linking, and GRN stock verification. |
| **15** | **Stock adjustment + branch transfer** | 🟡 | `src/actions/stock-action.ts`, `shaa-backend/src/routes/stock-transfer.routes.ts` | Single & variant stock adjustments work. Branch transfer UI is partial and lacks dispatch-receive verification workflows. |
| **16** | **Excel/CSV import with validation**| 🟡 | `src/app/(sidebar)/admin/products/page.tsx` | Export to Excel works across all reports; bulk product/stock CSV import with batch validation is incomplete. |
| **17** | **Multi-branch stock + billing series** | 🟡 | `schema.prisma:86-105, 243-273` | Branch isolation exists on all models. Invoices share a single global series (`INV-YYYY-XXXX`) rather than per-branch prefix (`CAL-YYYY-XXXX`). |
| **18** | **Role permissions + audit log** | 🟡 | `shaa-backend/src/constants/permissions.ts`, `src/lib/mock-audit-db.ts` | 13 granular RBAC permissions enforced on API. Audit log is backed by mock data rather than database table. |
| **19** | **GST + HSN reports** | 🟡 | `src/app/(sidebar)/admin/accounting/gst/page.tsx` | Store runs under Composition Scheme (tax not collected at POS). GST report screen exists as partial accounting view. |
| **20** | **Sales / profit / stock / branch reports**| ✅ | `src/app/(sidebar)/reports/sales-report/page.tsx`, `pnl-reports/page.tsx` | Comprehensive Sales and P&L reports with Gross Margin, COGS, Discounts, and Excel downloads. |

---

## 11. Risks & Technical Debt

1. **POS Grid Architecture Re-renders**: `pos-billing.tsx` contains 2,421 lines in a single React client component. Any keystroke in search or barcode input re-evaluates all cart calculations, held bill snapshots, and filter states. Separating Cart Grid, Search Bar, and Summary into memoized sub-components is critical for 60fps keyboard input.
2. **Lack of Hardware Scanner Global Hook**: Cashiers frequently scan items while focus is inadvertently on a dropdown or table header, leading to missed items or corrupted input values.
3. **Database Concurrency on Low Stock**: Atomic stock decrement occurs at transaction execution without pre-validation locking. Concurrent checkout by two cashiers for the final unit can cause stock to dip to `-1`.
4. **Held Bills Volatility**: Storing held tickets in client component state leads to cart abandonment if the browser crashes or is refreshed.
5. **No Shift Register Tracking**: Discrepancies between cash collected in drawer and system billing cannot be identified without a Cash Register Open/Close shift ledger.

---

## 12. Integration Plan & Proposed Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Phase 1: High-Speed POS Grid                          │
│  • Excel-style in-place editable grid (TanStack Virtual / Custom Table)     │
│  • Global hardware barcode scanner buffer (intercepts scans anywhere)       │
│  • F-Key shortcuts (F1=Help, F2=Search, F4=Hold, F8=Pay, F9=Disc, Esc=Clear)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Phase 2: Cash Register & Hardened POS                    │
│  • Cash Register Shift Model (Opening Float, Cash Drops, Day-End Z-Report)  │
│  • IndexedDB persistent Held Bills (multi-tab session resilience)           │
│  • Cashier discount caps with Manager PIN override                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Phase 3: Hardware & ESC/POS Upgrades                     │
│  • Raw ESC/POS byte printing (Cash drawer kick pulse + Paper auto-cut)      │
│  • 58mm and 80mm dynamic thermal templates                                  │
│  • Dynamic UPI QR code generation on bill bottom (UPI Intent string)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Proposed Additive Database Migrations

```prisma
// Proposed Additive Models for Phase 2:
model CashRegisterSession {
  id              String    @id @default(uuid())
  branchId        String
  userId          String
  openedAt        DateTime  @default(now())
  closedAt        DateTime?
  openingBalance  Decimal   @db.Decimal(12, 2)
  closingCashCalc Decimal?  @db.Decimal(12, 2)
  closingCashAct  Decimal?  @db.Decimal(12, 2)
  note            String?
  status          String    @default("OPEN") // OPEN | CLOSED

  branch Branch @relation(fields: [branchId], references: [id])
  user   User   @relation(fields: [userId], references: [id])
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  branchId   String?
  action     String   // CREATE_SALE, UPDATE_SALE, DELETE_INVOICE, STOCK_ADJUST
  entity     String   // Sale, Product, Customer
  entityId   String
  oldValues  Json?
  newValues  Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
}
```

### Recommended Libraries

| Library | Purpose / Justification | Effort | Risk |
| :--- | :--- | :---: | :---: |
| `mousetrap` or `react-hotkeys-hook` | Robust cross-browser hotkey handling with modal and input scoping | S | Low |
| `idb` / `localforage` | Zero-latency IndexedDB client cache for persistent held bills & offline resilience | S | Low |
| `qrcode` | Generating standard Indian UPI Dynamic Payment QRs on thermal receipts | S | Low |

---

## Top 10 Architectural Findings

1. **Composition Tax Scheme in POS**: The billing engine is tailored for the Composition Scheme; tax is not collected at checkout, simplifying line calculations to `Subtotal = Qty * Price - Discount`.
2. **QZ Tray Silent Thermal Printing**: Direct silent printing is fully integrated via WebSocket with digital signature authentication, eliminating browser print dialog friction.
3. **Missing Excel-Style In-Grid Billing**: Current cart uses a standard web table with button steppers rather than a keyboard-traversable data grid.
4. **Absence of Function Key Hotkeys (F1–F12)**: Standard retail POS keybindings are missing, making full mouse-free operation impossible for cashiers.
5. **Hardware Scanner Focus Dependency**: Barcode scanning only works when the specific barcode input is focused; background scans into other fields cause input corruption.
6. **Volatile Held Bills**: Held bills exist only in React component memory and are lost on reload.
7. **No Cash Register Shift Management**: No opening balance float or day-end Z-Report reconciliation exists to audit physical drawer cash.
8. **Decoupled Update Validation**: Sales updates are now separated from initial stock constraints, enabling dynamic invoice edits on dispatched bills.
9. **Granular Backend RBAC**: 13 permission keys are enforced across Express routes, preventing unauthorized deletions or price modifications.
10. **Monolithic POS Component**: `pos-billing.tsx` (2,421 lines) handles state, hotkeys, printing, customer creation, and calculations in a single component, creating unnecessary re-renders during high-speed typing.

---

## Clarifying Questions for Next Phase

1. **GST Mode**: Should the POS support dynamic switching between **Composition Scheme** (0% collected tax) and **Regular GST** (5%, 12%, 18% CGST/SGST line breakdown), or will this deployment remain strictly Composition Taxpayer?
2. **Thermal Receipt Hardware**: What exact printer model(s) (e.g., EPSON TM-T82, TVS RP-3160, NGX) and paper roll sizes (80mm vs 58mm) are used in the Hilite Mall store?
3. **Cash Drawer & Auto-Cut**: Do the POS counters have RJ11 cash drawers connected to the thermal printers that require an automated kick pulse on cash checkout?
4. **Discount Approval Policy**: What is the maximum discount percentage a standard cashier should be permitted to give before requiring a manager PIN override?
