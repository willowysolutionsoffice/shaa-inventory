'use server';

import { api } from '@/lib/api';

export async function getDashboardData(
  userId?: string,
  userRole?: string | null,
  userBranch?: string | null,
) {
  try {
    const params = new URLSearchParams();
    if (userBranch) params.set('branchId', userBranch);

    const url  = `/dashboard${params.toString() ? `?${params}` : ''}`;
    const data = await api.get<any>(url);
    return data;
  } catch {
    return {
      stats: {
        totalSuppliers:            0,
        totalCustomers:            0,
        totalProducts:             0,
        lowStockItems:             0,
        recentProducts:            0,
        recentSuppliers:           0,
        totalPurchaseAmount:       0,
        totalSaleAmount:           0,
        totalExpenseAmount:        0,
        totalSalesReturnAmount:    0,
        totalPurchaseReturnAmount: 0,
      },
      recentActivity: {
        newProducts:    { count: 0, description: '0 new products added this week' },
        suppliersAdded: { count: 0, description: '0 new suppliers onboarded this week' },
      },
    };
  }
}