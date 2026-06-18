'use server';

import { api } from '@/lib/api';

export async function getOptimizedDashboardData(branchId?: string) {
  try {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);

    const url  = `/dashboard/optimized${params.toString() ? `?${params}` : ''}`;
    const data = await api.get<any>(url);
    return data;
  } catch {
    return {
      totalSuppliers:       0,
      totalCustomers:       0,
      totalProducts:        0,
      lowStockItems:        0,
      recentProducts:       0,
      recentSuppliers:      0,

      todaysSales:          0,
      todaysSalesCount:     0,
      todaysPurchases:      0,
      todaysPurchasesCount: 0,

      monthlySales:         [],
      monthlyPurchases:     [],

      recentSales:          [],
      recentPurchases:      [],

      topProducts:          [],
      topSuppliers:         [],
      topCustomers:         [],

      stockLevels:          [],

      totalOutstanding:     0,
      outstandingCount:     0,
    };
  }
}