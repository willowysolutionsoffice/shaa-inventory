// src/lib/actions/dashboard.ts
// Mock implementation of getDashboardData for frontend-only build

export async function getDashboardData(userId?: string, userRole?: string | null, userBranch?: string | null) {
  return {
    stats: {
      totalSuppliers: 12,
      totalCustomers: 34,
      totalProducts: 48,
      lowStockItems: 2,
      recentProducts: 4,
      recentSuppliers: 1,
      totalPurchaseAmount: 18500.00,
      totalSaleAmount: 24650.50,
      totalExpenseAmount: 3200.00,
      totalSalesReturnAmount: 450.00,
      totalPurchaseReturnAmount: 150.00,
    },
    recentActivity: {
      newProducts: {
        count: 4,
        description: '4 new products added this week',
      },
      suppliersAdded: {
        count: 1,
        description: '1 new supplier onboarded this week',
      },
    },
  };
}
