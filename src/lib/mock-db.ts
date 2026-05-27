// src/lib/mock-db.ts
// Demo data based on Shaa Calicut — Kerala textile retail store
// Products: Unstitched dress materials, sarees, kurtis, suits, lawn collections

export interface Branch {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  expenseDate: Date;
  categoryId: string;
  branchId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  product_name: string;
  sku: string;
  brandId: string;
  branchId: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  unit: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  openingBalance: number;
  outstandingPayments: number;
  salesDue: number;
  salesReturnDue: number;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  openingBalance: number;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  salesdate: Date;
  customerId: string;
  branchId: string;
  grandTotal: number;
  paymentStatus: string;
  paymentDue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  purchaseDate: Date;
  supplierId: string;
  branchId: string;
  totalAmount: number;
  paymentStatus: string;
  paymentDue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesPayment {
  id: string;
  saleId: string;
  amount: number;
  paidOn: Date;
  paymentMethod: string;
  paymentNote?: string | null;
  dueDate?: Date | null;
}

export interface PurchasePayment {
  id: string;
  purchaseId: string;
  amount: number;
  paidOn: Date;
  paymentMethod: string;
  paymentNote?: string | null;
  dueDate?: Date | null;
}

export interface SalesReturn {
  id: string;
  returnNo: string;
  returnDate: Date;
  saleId: string;
  customerId: string;
  branchId: string;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesReturnItem {
  id: string;
  salesReturnId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
}

export interface PurchaseReturn {
  id: string;
  returnNo: string;
  returnDate: Date;
  purchaseId: string;
  supplierId: string;
  branchId: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseReturnItem {
  id: string;
  purchaseReturnId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BalancePayment {
  id: string;
  customerId?: string;
  supplierId?: string;
  amount: number;
  paidOn: Date;
  paymentMethod: string;
  paymentNote?: string | null;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
const globalStore = globalThis as unknown as {
  db: {
    branches: Branch[];
    brands: Brand[];
    categories: ExpenseCategory[];
    expenses: Expense[];
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    sales: Sale[];
    saleItems: SaleItem[];
    purchases: Purchase[];
    purchaseItems: PurchaseItem[];
    salesPayments: SalesPayment[];
    purchasePayments: PurchasePayment[];
    salesReturns: SalesReturn[];
    salesReturnItems: SalesReturnItem[];
    purchaseReturns: PurchaseReturn[];
    purchaseReturnItems: PurchaseReturnItem[];
    balancePayments: BalancePayment[];
  };
};

if (!globalStore.db) {
  globalStore.db = {
    // ── BRANCHES ───────────────────────────────────────────────────────────────
    branches: [
      {
        id: "branch-calicut",
        name: "Shaa Calicut – Main Store",
        phone: "0495-2723456",
        email: "main@shaacalicut.com",
        address: "Mavoor Road, Kozhikode, Kerala – 673004",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "branch-malappuram",
        name: "Shaa Malappuram",
        phone: "0483-2734567",
        email: "malappuram@shaacalicut.com",
        address: "Junction Road, Malappuram, Kerala – 676505",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "branch-tirur",
        name: "Shaa Tirur",
        phone: "0494-2442211",
        email: "tirur@shaacalicut.com",
        address: "Main Bazar, Tirur, Malappuram, Kerala – 676101",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── BRANDS ─────────────────────────────────────────────────────────────────
    brands: [
      {
        id: "brand-gulaal",
        name: "Gulaal",
        description: "Pakistani luxury lawn and unstitched collections",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-gul-ahmed",
        name: "Gul Ahmed",
        description: "Premium Pakistani fabric — lawn, linen, khaddar",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-sapphire",
        name: "Sapphire",
        description: "Pakistani ready-to-wear and unstitched collections",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-kota-sarees",
        name: "Kota Doria",
        description: "Traditional Rajasthani kota doria sarees and dupattas",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-banarasi",
        name: "Banarasi Weaves",
        description: "Handloom Banarasi silk sarees and dress materials",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-house-of-shaa",
        name: "House of Shaa",
        description: "Shaa Calicut in-house exclusive collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── EXPENSE CATEGORIES ─────────────────────────────────────────────────────
    categories: [
      {
        id: "cat-rent",
        name: "Rent & Utilities",
        description: "Store rent, electricity, water bills",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-staff",
        name: "Staff & Salaries",
        description: "Salaries, incentives, ESI, PF",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-marketing",
        name: "Marketing & Promotions",
        description: "Social media ads, banners, festival campaigns",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-logistics",
        name: "Logistics & Freight",
        description: "Courier charges, transport, loading/unloading",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── EXPENSES ───────────────────────────────────────────────────────────────
    expenses: [
      {
        id: "exp-1",
        title: "Mavoor Road Store Rent – May 2026",
        amount: 45000,
        expenseDate: new Date(Date.now() - 86400000 * 3),
        categoryId: "cat-rent",
        branchId: "branch-calicut",
        description: "Monthly rent for main Kozhikode showroom",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "exp-2",
        title: "Eid Festival Social Media Campaign",
        amount: 12000,
        expenseDate: new Date(Date.now() - 86400000 * 7),
        categoryId: "cat-marketing",
        branchId: "branch-calicut",
        description: "Facebook & Instagram ads for Eid collection launch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "exp-3",
        title: "Courier Charges – Supplier Stock Inward",
        amount: 3200,
        expenseDate: new Date(Date.now() - 86400000 * 2),
        categoryId: "cat-logistics",
        branchId: "branch-malappuram",
        description: "Freight for Gulaal & Gul Ahmed stock from Delhi warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── PRODUCTS ───────────────────────────────────────────────────────────────
    products: [
      // Unstitched Dress Materials
      {
        id: "prod-1",
        product_name: "Gulaal Delia Lawn – Unstitched 3-Piece",
        sku: "GUL-DELIA-LP-01",
        brandId: "brand-gulaal",
        branchId: "branch-calicut",
        stock: 24,
        purchasePrice: 3200,
        sellingPrice: 4999,
        unit: "pcs",
        description: "Printed lawn shirt, silk dupatta, printed cotton trouser with embroidered organza neckline",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-2",
        product_name: "Gul Ahmed Summer Lawn – Unstitched 3-Piece",
        sku: "GA-SML-UP-02",
        brandId: "brand-gul-ahmed",
        branchId: "branch-calicut",
        stock: 30,
        purchasePrice: 2400,
        sellingPrice: 3799,
        unit: "pcs",
        description: "Digital printed lawn shirt, chiffon dupatta, dyed cambric trouser",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-3",
        product_name: "Sapphire Eid Festive Unstitched – Embroidered",
        sku: "SAP-EID-EU-03",
        brandId: "brand-sapphire",
        branchId: "branch-calicut",
        stock: 15,
        purchasePrice: 4500,
        sellingPrice: 6999,
        unit: "pcs",
        description: "Embroidered karandi shirt, organza embroidered dupatta, raw silk trouser",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-4",
        product_name: "Gulaal Mahi Collection – Unstitched Khaddar",
        sku: "GUL-MAHI-KH-04",
        brandId: "brand-gulaal",
        branchId: "branch-malappuram",
        stock: 18,
        purchasePrice: 2800,
        sellingPrice: 4299,
        unit: "pcs",
        description: "Printed khaddar shirt, printed khaddar dupatta, dyed trouser – winter collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Sarees
      {
        id: "prod-5",
        product_name: "Banarasi Pure Silk Saree – Zari Border",
        sku: "BAN-SILK-ZB-05",
        brandId: "brand-banarasi",
        branchId: "branch-calicut",
        stock: 10,
        purchasePrice: 5500,
        sellingPrice: 8999,
        unit: "pcs",
        description: "Handloom Banarasi pure silk saree with heavy zari border and brocade pallu – bridal range",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-6",
        product_name: "Kota Doria Cotton-Silk Saree – Block Print",
        sku: "KOTA-CS-BP-06",
        brandId: "brand-kota-sarees",
        branchId: "branch-calicut",
        stock: 20,
        purchasePrice: 1200,
        sellingPrice: 1999,
        unit: "pcs",
        description: "Lightweight Kota doria saree with traditional block print – ideal for daily wear",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-7",
        product_name: "Georgette Embroidered Saree – Party Wear",
        sku: "GEO-EMB-PW-07",
        brandId: "brand-house-of-shaa",
        branchId: "branch-calicut",
        stock: 12,
        purchasePrice: 2200,
        sellingPrice: 3499,
        unit: "pcs",
        description: "Soft georgette saree with sequin and thread embroidery – perfect for weddings and parties",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-8",
        product_name: "Kerala Kasavu Saree – Pure Cotton Settu Mundu",
        sku: "KER-KAS-CM-08",
        brandId: "brand-house-of-shaa",
        branchId: "branch-calicut",
        stock: 35,
        purchasePrice: 800,
        sellingPrice: 1399,
        unit: "pcs",
        description: "Traditional Kerala off-white cotton saree with golden kasavu border – festival special",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Kurtis & Readymades
      {
        id: "prod-9",
        product_name: "Anarkali Rayon Kurti – Printed Long – XL",
        sku: "ANK-RAY-PL-XL-09",
        brandId: "brand-house-of-shaa",
        branchId: "branch-calicut",
        stock: 40,
        purchasePrice: 450,
        sellingPrice: 799,
        unit: "pcs",
        description: "Long printed rayon anarkali kurti with side slits – available in S/M/L/XL/XXL",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-10",
        product_name: "Palazzo Kurti Set – Muslin with Dupatta",
        sku: "PAL-MUS-DP-10",
        brandId: "brand-house-of-shaa",
        branchId: "branch-malappuram",
        stock: 25,
        purchasePrice: 650,
        sellingPrice: 1099,
        unit: "pcs",
        description: "3-piece palazzo set: printed muslin kurti, matching palazzo, and contrast dupatta",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Fabrics by Metre
      {
        id: "prod-11",
        product_name: "Pure Linen Fabric – Solid – Per Metre",
        sku: "LIN-SOL-PM-11",
        brandId: "brand-house-of-shaa",
        branchId: "branch-calicut",
        stock: 200,
        purchasePrice: 180,
        sellingPrice: 299,
        unit: "pcs",
        description: "60s count pure linen – breathable, ideal for kurtis and trousers – sold per metre",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-12",
        product_name: "Chiffon Printed Fabric – Per Metre",
        sku: "CHF-PRT-PM-12",
        brandId: "brand-house-of-shaa",
        branchId: "branch-tirur",
        stock: 150,
        purchasePrice: 120,
        sellingPrice: 199,
        unit: "pcs",
        description: "Lightweight digital printed chiffon fabric – ideal for dupattas and blouses",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Dupattas
      {
        id: "prod-13",
        product_name: "Embroidered Organza Dupatta – Bridal",
        sku: "ORG-EMB-BD-13",
        brandId: "brand-gulaal",
        branchId: "branch-calicut",
        stock: 22,
        purchasePrice: 900,
        sellingPrice: 1499,
        unit: "pcs",
        description: "Heavy embroidered organza dupatta with mirror work – bridal & wedding collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-14",
        product_name: "Gul Ahmed Silk Dupatta – Digital Print",
        sku: "GA-SILK-DP-14",
        brandId: "brand-gul-ahmed",
        branchId: "branch-calicut",
        stock: 30,
        purchasePrice: 600,
        sellingPrice: 999,
        unit: "pcs",
        description: "Soft silk dupatta with digital floral print – pairs with any unstitched suit",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Salwar Sets
      {
        id: "prod-15",
        product_name: "Sapphire Ready-to-Wear Embroidered Suit",
        sku: "SAP-RTW-ES-15",
        brandId: "brand-sapphire",
        branchId: "branch-malappuram",
        stock: 8,
        purchasePrice: 5200,
        sellingPrice: 7999,
        unit: "pcs",
        description: "Stitched 3-piece embroidered lawn suit with organza dupatta – Eid festive collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── CUSTOMERS ──────────────────────────────────────────────────────────────
    customers: [
      {
        id: "cust-1",
        name: "Fathima Beevi K",
        email: "fathima.beevi@gmail.com",
        phone: "9447112345",
        openingBalance: 0,
        outstandingPayments: 0,
        salesDue: 0,
        salesReturnDue: 0,
        branchId: "branch-calicut",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cust-2",
        name: "Zainab Hussain",
        email: "zainab.h@yahoo.com",
        phone: "9895234567",
        openingBalance: 500,
        outstandingPayments: 0,
        salesDue: 500,
        salesReturnDue: 0,
        branchId: "branch-calicut",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cust-3",
        name: "Mariyam Siddique",
        email: "",
        phone: "9745345678",
        openingBalance: 0,
        outstandingPayments: 0,
        salesDue: 0,
        salesReturnDue: 0,
        branchId: "branch-malappuram",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cust-4",
        name: "Anitha Krishnan",
        email: "anitha.k@gmail.com",
        phone: "9387456789",
        openingBalance: 0,
        outstandingPayments: 0,
        salesDue: 1200,
        salesReturnDue: 0,
        branchId: "branch-calicut",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cust-5",
        name: "Reshma Abdul Razak",
        email: "reshma.ar@gmail.com",
        phone: "9656567890",
        openingBalance: 0,
        outstandingPayments: 0,
        salesDue: 0,
        salesReturnDue: 0,
        branchId: "branch-tirur",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── SUPPLIERS ──────────────────────────────────────────────────────────────
    suppliers: [
      {
        id: "sup-1",
        name: "Gulaal Pakistan – India Distributor",
        email: "gulaal.india@gulaal.pk",
        phone: "9810123456",
        openingBalance: 0,
        branchId: "branch-calicut",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sup-2",
        name: "Gul Ahmed Textiles – Kozhikode Agent",
        email: "orders@gulahmedkozhikode.in",
        phone: "9447987654",
        openingBalance: 15000,
        branchId: "branch-calicut",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sup-3",
        name: "Banarasi Silk House – Varanasi",
        email: "sales@banarasisilkhouse.in",
        phone: "9451123456",
        openingBalance: 0,
        branchId: "branch-calicut",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sup-4",
        name: "Sapphire Fashion – Kerala Distributor",
        email: "sapphire.kerala@sapphire.com.pk",
        phone: "9895321654",
        openingBalance: 8000,
        branchId: "branch-malappuram",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── SALES ──────────────────────────────────────────────────────────────────
    sales: [
      {
        id: "sale-1",
        invoiceNo: "SHAA-2026-0041",
        salesdate: new Date(Date.now() - 3600000 * 2),
        customerId: "cust-1",
        branchId: "branch-calicut",
        grandTotal: 9998,
        paymentStatus: "paid",
        paymentDue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sale-2",
        invoiceNo: "SHAA-2026-0042",
        salesdate: new Date(Date.now() - 3600000 * 5),
        customerId: "cust-2",
        branchId: "branch-calicut",
        grandTotal: 6498,
        paymentStatus: "partial",
        paymentDue: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sale-3",
        invoiceNo: "SHAA-2026-0043",
        salesdate: new Date(Date.now() - 86400000),
        customerId: "cust-4",
        branchId: "branch-calicut",
        grandTotal: 14997,
        paymentStatus: "partial",
        paymentDue: 1200,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sale-4",
        invoiceNo: "SHAA-2026-0044",
        salesdate: new Date(Date.now() - 86400000 * 2),
        customerId: "cust-3",
        branchId: "branch-malappuram",
        grandTotal: 4299,
        paymentStatus: "paid",
        paymentDue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sale-5",
        invoiceNo: "SHAA-2026-0045",
        salesdate: new Date(Date.now() - 86400000 * 3),
        customerId: "cust-5",
        branchId: "branch-tirur",
        grandTotal: 3996,
        paymentStatus: "paid",
        paymentDue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── SALE ITEMS ─────────────────────────────────────────────────────────────
    saleItems: [
      {
        id: "sitem-1",
        saleId: "sale-1",
        productId: "prod-1",
        quantity: 2,
        unitPrice: 4999,
        discount: 0,
        subtotal: 9998,
        total: 9998,
        purchasePrice: 3200,
        sellingPrice: 4999,
      },
      {
        id: "sitem-2",
        saleId: "sale-2",
        productId: "prod-3",
        quantity: 1,
        unitPrice: 6999,
        discount: 501,
        subtotal: 6498,
        total: 6498,
        purchasePrice: 4500,
        sellingPrice: 6999,
      },
      {
        id: "sitem-3",
        saleId: "sale-3",
        productId: "prod-5",
        quantity: 1,
        unitPrice: 8999,
        discount: 0,
        subtotal: 8999,
        total: 8999,
        purchasePrice: 5500,
        sellingPrice: 8999,
      },
      {
        id: "sitem-4",
        saleId: "sale-3",
        productId: "prod-7",
        quantity: 1,
        unitPrice: 3499,
        discount: 0,
        subtotal: 3499,
        total: 3499,
        purchasePrice: 2200,
        sellingPrice: 3499,
      },
      {
        id: "sitem-5",
        saleId: "sale-3",
        productId: "prod-8",
        quantity: 1,
        unitPrice: 1399,
        discount: 900,
        subtotal: 2499,
        total: 2499,
        purchasePrice: 800,
        sellingPrice: 1399,
      },
      {
        id: "sitem-6",
        saleId: "sale-4",
        productId: "prod-4",
        quantity: 1,
        unitPrice: 4299,
        discount: 0,
        subtotal: 4299,
        total: 4299,
        purchasePrice: 2800,
        sellingPrice: 4299,
      },
      {
        id: "sitem-7",
        saleId: "sale-5",
        productId: "prod-12",
        quantity: 20,
        unitPrice: 199,
        discount: 4,
        subtotal: 3980,
        total: 3980,
        purchasePrice: 120,
        sellingPrice: 199,
      },
    ],

    // ── PURCHASES ──────────────────────────────────────────────────────────────
    purchases: [
      {
        id: "pur-1",
        purchaseNo: "PO-2026-0011",
        purchaseDate: new Date(Date.now() - 3600000 * 24),
        supplierId: "sup-1",
        branchId: "branch-calicut",
        totalAmount: 76800,
        paymentStatus: "paid",
        paymentDue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pur-2",
        purchaseNo: "PO-2026-0012",
        purchaseDate: new Date(Date.now() - 86400000 * 4),
        supplierId: "sup-3",
        branchId: "branch-calicut",
        totalAmount: 55000,
        paymentStatus: "partial",
        paymentDue: 15000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pur-3",
        purchaseNo: "PO-2026-0013",
        purchaseDate: new Date(Date.now() - 86400000 * 6),
        supplierId: "sup-4",
        branchId: "branch-malappuram",
        totalAmount: 41600,
        paymentStatus: "partial",
        paymentDue: 8000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    // ── PURCHASE ITEMS ─────────────────────────────────────────────────────────
    purchaseItems: [
      {
        id: "pitem-1",
        purchaseId: "pur-1",
        productId: "prod-1",
        quantity: 12,
        unitPrice: 3200,
        total: 38400,
      },
      {
        id: "pitem-2",
        purchaseId: "pur-1",
        productId: "prod-2",
        quantity: 12,
        unitPrice: 2400,
        total: 28800,
      },
      {
        id: "pitem-3",
        purchaseId: "pur-1",
        productId: "prod-13",
        quantity: 10,
        unitPrice: 900,
        total: 9600,
      },
      {
        id: "pitem-4",
        purchaseId: "pur-2",
        productId: "prod-5",
        quantity: 5,
        unitPrice: 5500,
        total: 27500,
      },
      {
        id: "pitem-5",
        purchaseId: "pur-2",
        productId: "prod-7",
        quantity: 8,
        unitPrice: 2200,
        total: 17600,
      },
      {
        id: "pitem-6",
        purchaseId: "pur-2",
        productId: "prod-8",
        quantity: 25,
        unitPrice: 800,
        total: 9900,
      },
      {
        id: "pitem-7",
        purchaseId: "pur-3",
        productId: "prod-3",
        quantity: 8,
        unitPrice: 4500,
        total: 36000,
      },
      {
        id: "pitem-8",
        purchaseId: "pur-3",
        productId: "prod-15",
        quantity: 8,
        unitPrice: 700,
        total: 5600,
      },
    ],

    // ── SALES PAYMENTS ─────────────────────────────────────────────────────────
    salesPayments: [
      {
        id: "spay-1",
        saleId: "sale-1",
        amount: 9998,
        paidOn: new Date(),
        paymentMethod: "UPI",
        paymentNote: "GPay payment – Eid collection purchase",
      },
      {
        id: "spay-2",
        saleId: "sale-2",
        amount: 5998,
        paidOn: new Date(),
        paymentMethod: "Cash",
        paymentNote: "Partial cash payment, balance pending",
      },
      {
        id: "spay-3",
        saleId: "sale-3",
        amount: 13797,
        paidOn: new Date(),
        paymentMethod: "Card",
        paymentNote: "Card swipe – wedding saree purchase",
      },
      {
        id: "spay-4",
        saleId: "sale-4",
        amount: 4299,
        paidOn: new Date(),
        paymentMethod: "Cash",
        paymentNote: "Full cash payment",
      },
      {
        id: "spay-5",
        saleId: "sale-5",
        amount: 3996,
        paidOn: new Date(),
        paymentMethod: "UPI",
        paymentNote: "PhonePe – fabric per metre billing",
      },
    ],

    // ── PURCHASE PAYMENTS ──────────────────────────────────────────────────────
    purchasePayments: [
      {
        id: "ppay-1",
        purchaseId: "pur-1",
        amount: 76800,
        paidOn: new Date(),
        paymentMethod: "Bank Transfer",
        paymentNote: "NEFT – Gulaal stock payment in full",
      },
      {
        id: "ppay-2",
        purchaseId: "pur-2",
        amount: 40000,
        paidOn: new Date(),
        paymentMethod: "Cheque",
        paymentNote: "First cheque – Banarasi silk house",
      },
      {
        id: "ppay-3",
        purchaseId: "pur-3",
        amount: 33600,
        paidOn: new Date(),
        paymentMethod: "Bank Transfer",
        paymentNote: "IMPS – Sapphire Kerala advance",
      },
    ],

    // ── SALES RETURNS ──────────────────────────────────────────────────────────
    salesReturns: [
      {
        id: "sret-1",
        returnNo: "SR-2026-001",
        returnDate: new Date(Date.now() - 86400000),
        saleId: "sale-2",
        customerId: "cust-2",
        branchId: "branch-calicut",
        grandTotal: 6999,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    salesReturnItems: [
      {
        id: "sritem-1",
        salesReturnId: "sret-1",
        productId: "prod-3",
        quantity: 1,
        unitPrice: 6999,
        subtotal: 6999,
        total: 6999,
      },
    ],

    // ── PURCHASE RETURNS ───────────────────────────────────────────────────────
    purchaseReturns: [
      {
        id: "pret-1",
        returnNo: "PR-2026-001",
        returnDate: new Date(Date.now() - 86400000 * 3),
        purchaseId: "pur-2",
        supplierId: "sup-3",
        branchId: "branch-calicut",
        totalAmount: 5500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],

    purchaseReturnItems: [
      {
        id: "pritem-1",
        purchaseReturnId: "pret-1",
        productId: "prod-5",
        quantity: 1,
        unitPrice: 5500,
        total: 5500,
      },
    ],

    // ── BALANCE PAYMENTS ───────────────────────────────────────────────────────
    balancePayments: [
      {
        id: "bpay-1",
        customerId: "cust-2",
        amount: 500,
        paidOn: new Date(),
        paymentMethod: "Cash",
        paymentNote: "Opening balance cleared",
      },
      {
        id: "bpay-2",
        supplierId: "sup-2",
        amount: 15000,
        paidOn: new Date(),
        paymentMethod: "Bank Transfer",
        paymentNote: "Gul Ahmed outstanding balance payment",
      },
    ],
  };
}

export const db = globalStore.db;