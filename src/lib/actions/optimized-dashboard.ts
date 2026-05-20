// src/lib/actions/optimized-dashboard.ts
// Mock implementation of getOptimizedDashboardData for frontend-only build

export async function getOptimizedDashboardData(branchId?: string) {
  const today = new Date();
  
  // Generating some mock monthly records
  const monthlySales = [];
  const monthlyPurchases = [];

  for (let i = 0; i < 15; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    monthlySales.push({
      salesdate: d,
      _sum: { grandTotal: 500 + Math.random() * 800 }
    });

    monthlyPurchases.push({
      purchaseDate: d,
      _sum: { totalAmount: 300 + Math.random() * 500 }
    });
  }

  const recentSales = [
    {
      id: "sale-1",
      salesdate: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      grandTotal: 350.00,
      customer: { name: "John Smith" },
      items: [
        { product: { product_name: "Wireless Mouse" }, quantity: 2 }
      ]
    },
    {
      id: "sale-2",
      salesdate: new Date(Date.now() - 3600000 * 5), // 5 hours ago
      grandTotal: 120.50,
      customer: { name: "Alice Johnson" },
      items: [
        { product: { product_name: "Mechanical Keyboard" }, quantity: 1 }
      ]
    },
    {
      id: "sale-3",
      salesdate: new Date(Date.now() - 86400000), // Yesterday
      grandTotal: 850.00,
      customer: { name: "Bob Miller" },
      items: [
        { product: { product_name: "27-inch 4K Monitor" }, quantity: 2 }
      ]
    },
    {
      id: "sale-4",
      salesdate: new Date(Date.now() - 86400000 * 2), // 2 days ago
      grandTotal: 45.00,
      customer: { name: "David Wilson" },
      items: [
        { product: { product_name: "USB-C Cable" }, quantity: 3 }
      ]
    },
    {
      id: "sale-5",
      salesdate: new Date(Date.now() - 86400000 * 3), // 3 days ago
      grandTotal: 1500.00,
      customer: { name: "Emma Davis" },
      items: [
        { product: { product_name: "Office Chair" }, quantity: 5 }
      ]
    }
  ];

  const recentPurchases = [
    {
      id: "purchase-1",
      purchaseDate: new Date(Date.now() - 3600000 * 4),
      totalAmount: 1200.00,
      supplier: { name: "Tech Distributors Ltd" },
      items: [
        { product: { product_name: "Wireless Mouse" }, quantity: 50 }
      ]
    },
    {
      id: "purchase-2",
      purchaseDate: new Date(Date.now() - 86400000),
      totalAmount: 2500.00,
      supplier: { name: "Global Office Supplies" },
      items: [
        { product: { product_name: "Office Chair" }, quantity: 15 }
      ]
    }
  ];

  const topProducts = [
    {
      productId: "prod-1",
      _sum: { quantity: 125 },
      product: {
        product_name: "Wireless Mouse",
        stock: 45
      }
    },
    {
      productId: "prod-2",
      _sum: { quantity: 84 },
      product: {
        product_name: "Mechanical Keyboard",
        stock: 12
      }
    },
    {
      productId: "prod-3",
      _sum: { quantity: 42 },
      product: {
        product_name: "27-inch 4K Monitor",
        stock: 8
      }
    },
    {
      productId: "prod-4",
      _sum: { quantity: 31 },
      product: {
        product_name: "Office Chair",
        stock: 5
      }
    }
  ];

  const topSuppliers = [
    {
      supplierId: "sup-1",
      _sum: { totalAmount: 15400 },
      supplier: { name: "Tech Distributors Ltd", phone: "555-0199" }
    },
    {
      supplierId: "sup-2",
      _sum: { totalAmount: 8900 },
      supplier: { name: "Global Office Supplies", phone: "555-0211" }
    }
  ];

  const topCustomers = [
    {
      customerId: "cust-1",
      _sum: { grandTotal: 5400 },
      customer: { name: "John Smith", phone: "555-1234" }
    },
    {
      customerId: "cust-2",
      _sum: { grandTotal: 3200 },
      customer: { name: "Emma Davis", phone: "555-9876" }
    }
  ];

  const stockLevels = [
    { id: "prod-3", product_name: "27-inch 4K Monitor", stock: 8, purchasePrice: 299 },
    { id: "prod-4", product_name: "Office Chair", stock: 5, purchasePrice: 120 },
    { id: "prod-2", product_name: "Mechanical Keyboard", stock: 12, purchasePrice: 59 },
    { id: "prod-5", product_name: "USB-C Hub Multiport", stock: 48, purchasePrice: 25 },
    { id: "prod-1", product_name: "Wireless Mouse", stock: 45, purchasePrice: 15 },
    { id: "prod-6", product_name: "Bluetooth Speaker", stock: 75, purchasePrice: 35 }
  ];

  return {
    totalSuppliers: 12,
    totalCustomers: 34,
    totalProducts: 48,
    lowStockItems: 2,

    todaysSales: 470.50,
    todaysSalesCount: 2,
    todaysPurchases: 1200.00,
    todaysPurchasesCount: 1,

    monthlySales,
    monthlyPurchases,

    recentProducts: 4,
    recentSuppliers: 1,
    recentSales,
    recentPurchases,

    topProducts,
    topSuppliers,
    topCustomers,

    stockLevels,

    totalOutstanding: 2450.00,
    outstandingCount: 3,
  };
}
