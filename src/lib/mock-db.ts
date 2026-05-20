// src/lib/mock-db.ts
// Centralized mock database for a fully interactive frontend-only experience

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

// In-Memory Collections (Reset on server restart, perfect for local demonstration)
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
  }
};

if (!globalStore.db) {
  globalStore.db = {
    branches: [
      {
        id: "main-branch",
        name: "Main Branch",
        phone: "555-0100",
        email: "main@example.com",
        address: "123 Main St, New York, NY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "east-branch",
        name: "East Coast Branch",
        phone: "555-0101",
        email: "east@example.com",
        address: "456 East St, Boston, MA",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "west-branch",
        name: "West Coast Branch",
        phone: "555-0102",
        email: "west@example.com",
        address: "789 West St, Los Angeles, CA",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    brands: [
      {
        id: "brand-logitech",
        name: "Logitech",
        description: "Computer accessories and gaming hardware",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-apple",
        name: "Apple",
        description: "Smartphones, tablets, and computers",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "brand-dell",
        name: "Dell",
        description: "Laptops, desktop computers, and monitors",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    categories: [
      {
        id: "cat-office",
        name: "Office Expenses",
        description: "Office rent, utilities, internet, and stationery",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-travel",
        name: "Travel & Fuel",
        description: "Business travel expenses and fuel reimbursements",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-marketing",
        name: "Marketing & Advertising",
        description: "Social media ads, printing materials, and promotional campaigns",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    expenses: [
      {
        id: "exp-1",
        title: "Office Rent May",
        amount: 1500,
        expenseDate: new Date(Date.now() - 86400000 * 5),
        categoryId: "cat-office",
        branchId: "main-branch",
        description: "Monthly office space rental payment",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "exp-2",
        title: "Social Media Promotion",
        amount: 450,
        expenseDate: new Date(Date.now() - 86400000 * 2),
        categoryId: "cat-marketing",
        branchId: "east-branch",
        description: "Facebook and Google search advertising budget",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    products: [
      {
        id: "prod-1",
        product_name: "Wireless Mouse MX Master 3S",
        sku: "LOGI-MX3S",
        brandId: "brand-logitech",
        branchId: "main-branch",
        stock: 45,
        purchasePrice: 65.00,
        sellingPrice: 99.00,
        description: "Premium ergonomic wireless mouse with silent clicks",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-2",
        product_name: "Mechanical Keyboard G915 TKL",
        sku: "LOGI-G915TKL",
        brandId: "brand-logitech",
        branchId: "east-branch",
        stock: 12,
        purchasePrice: 150.00,
        sellingPrice: 229.00,
        description: "Lightspeed wireless mechanical gaming keyboard without numpad",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-3",
        product_name: "Dell UltraSharp 27-inch 4K Monitor",
        sku: "DELL-U274K",
        brandId: "brand-dell",
        branchId: "west-branch",
        stock: 8,
        purchasePrice: 350.00,
        sellingPrice: 499.00,
        description: "High color-accuracy IPS monitor with USB-C Hub support",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-4",
        product_name: "Apple Magic Keyboard with Touch ID",
        sku: "APPL-MKID",
        brandId: "brand-apple",
        branchId: "main-branch",
        stock: 5,
        purchasePrice: 110.00,
        sellingPrice: 149.00,
        description: "Rechargeable wireless keyboard with secure Touch ID biometric sensor",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-5",
        product_name: "USB-C Multiport Adapter 7-in-1",
        sku: "DELL-USBC7",
        brandId: "brand-dell",
        branchId: "main-branch",
        stock: 48,
        purchasePrice: 25.00,
        sellingPrice: 45.00,
        description: "7-in-1 multi-port hub featuring HDMI, USB-A, and SD slots",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    customers: [
      {
        id: "cust-1",
        name: "John Smith",
        email: "john.smith@gmail.com",
        phone: "555-0101",
        openingBalance: 0,
        outstandingPayments: 0,
        salesDue: 0,
        salesReturnDue: 0,
        branchId: "main-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cust-2",
        name: "Emma Davis",
        email: "emma.davis@yahoo.com",
        phone: "555-0102",
        openingBalance: 150.00,
        outstandingPayments: 0,
        salesDue: 0,
        salesReturnDue: 0,
        branchId: "east-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cust-3",
        name: "Robert Johnson",
        email: "robert.j@outlook.com",
        phone: "555-0103",
        openingBalance: 0,
        outstandingPayments: 0,
        salesDue: 500.00,
        salesReturnDue: 0,
        branchId: "west-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    suppliers: [
      {
        id: "sup-1",
        name: "Logitech Distribution Center",
        email: "orders@logitech.com",
        phone: "555-0201",
        openingBalance: 0,
        branchId: "main-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sup-2",
        name: "Dell Wholesale Division",
        email: "sales@dellwholesale.com",
        phone: "555-0202",
        openingBalance: 3000.00,
        branchId: "east-branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    sales: [
      {
        id: "sale-1",
        invoiceNo: "INV-2026-001",
        salesdate: new Date(Date.now() - 3600000 * 2),
        customerId: "cust-1",
        branchId: "main-branch",
        grandTotal: 333.00,
        paymentStatus: "paid",
        paymentDue: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sale-2",
        invoiceNo: "INV-2026-002",
        salesdate: new Date(Date.now() - 3600000 * 5),
        customerId: "cust-2",
        branchId: "east-branch",
        grandTotal: 219.00,
        paymentStatus: "paid",
        paymentDue: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sale-3",
        invoiceNo: "INV-2026-003",
        salesdate: new Date(Date.now() - 86400000),
        customerId: "cust-3",
        branchId: "west-branch",
        grandTotal: 850.00,
        paymentStatus: "partial",
        paymentDue: 500.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    saleItems: [
      {
        id: "sitem-1",
        saleId: "sale-1",
        productId: "prod-1",
        quantity: 2,
        unitPrice: 99.00,
        discount: 0,
        subtotal: 198.00,
        total: 198.00,
        purchasePrice: 65.00,
        sellingPrice: 99.00,
      },
      {
        id: "sitem-2",
        saleId: "sale-1",
        productId: "prod-5",
        quantity: 3,
        unitPrice: 45.00,
        discount: 0,
        subtotal: 135.00,
        total: 135.00,
        purchasePrice: 25.00,
        sellingPrice: 45.00,
      },
      {
        id: "sitem-3",
        saleId: "sale-2",
        productId: "prod-2",
        quantity: 1,
        unitPrice: 229.00,
        discount: 10,
        subtotal: 219.00,
        total: 219.00,
        purchasePrice: 150.00,
        sellingPrice: 229.00,
      },
    ],
    purchases: [
      {
        id: "pur-1",
        purchaseNo: "PO-2026-001",
        purchaseDate: new Date(Date.now() - 3600000 * 12),
        supplierId: "sup-1",
        branchId: "main-branch",
        totalAmount: 1200.00,
        paymentStatus: "paid",
        paymentDue: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pur-2",
        purchaseNo: "PO-2026-002",
        purchaseDate: new Date(Date.now() - 86400000 * 3),
        supplierId: "sup-2",
        branchId: "east-branch",
        totalAmount: 2500.00,
        paymentStatus: "partial",
        paymentDue: 1000.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    purchaseItems: [
      {
        id: "pitem-1",
        purchaseId: "pur-1",
        productId: "prod-1",
        quantity: 20,
        unitPrice: 60.00,
        total: 1200.00,
      },
      {
        id: "pitem-2",
        purchaseId: "pur-2",
        productId: "prod-3",
        quantity: 5,
        unitPrice: 350.00,
        total: 1750.00,
      },
      {
        id: "pitem-3",
        purchaseId: "pur-2",
        productId: "prod-5",
        quantity: 30,
        unitPrice: 25.00,
        total: 750.00,
      },
    ],
    salesPayments: [
      {
        id: "spay-1",
        saleId: "sale-1",
        amount: 333.00,
        paidOn: new Date(),
        paymentMethod: "Cash",
        paymentNote: "Immediate cash payment",
      },
      {
        id: "spay-2",
        saleId: "sale-2",
        amount: 219.00,
        paidOn: new Date(),
        paymentMethod: "Card",
        paymentNote: "Card terminal payment",
      },
      {
        id: "spay-3",
        saleId: "sale-3",
        amount: 350.00,
        paidOn: new Date(),
        paymentMethod: "Bank Transfer",
        paymentNote: "Initial transfer payment",
      },
    ],
    purchasePayments: [
      {
        id: "ppay-1",
        purchaseId: "pur-1",
        amount: 1200.00,
        paidOn: new Date(),
        paymentMethod: "Bank Transfer",
        paymentNote: "Vendor invoice paid in full",
      },
      {
        id: "ppay-2",
        purchaseId: "pur-2",
        amount: 1500.00,
        paidOn: new Date(),
        paymentMethod: "Cheque",
        paymentNote: "First installment paid",
      },
    ],
    salesReturns: [
      {
        id: "sret-1",
        returnNo: "SR-2026-001",
        returnDate: new Date(Date.now() - 86400000),
        saleId: "sale-1",
        customerId: "cust-1",
        branchId: "main-branch",
        grandTotal: 99.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    salesReturnItems: [
      {
        id: "sritem-1",
        salesReturnId: "sret-1",
        productId: "prod-1",
        quantity: 1,
        unitPrice: 99.00,
        subtotal: 99.00,
        total: 99.00,
      },
    ],
    purchaseReturns: [
      {
        id: "pret-1",
        returnNo: "PR-2026-001",
        returnDate: new Date(Date.now() - 86400000 * 2),
        purchaseId: "pur-1",
        supplierId: "sup-1",
        branchId: "main-branch",
        totalAmount: 120.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    purchaseReturnItems: [
      {
        id: "pritem-1",
        purchaseReturnId: "pret-1",
        productId: "prod-1",
        quantity: 2,
        unitPrice: 60.00,
        total: 120.00,
      },
    ],
    balancePayments: [
      {
        id: "bpay-1",
        customerId: "cust-2",
        amount: 150.00,
        paidOn: new Date(),
        paymentMethod: "Cash",
        paymentNote: "Opening balance payment",
      },
    ],
  };
}

export const db = globalStore.db;
