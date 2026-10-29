'use server';

import { api } from '@/lib/api';
import { db } from '@/lib/mock-db';

export async function getMonthlyData(branchId?: string) {
  try {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);

    const url  = `/dashboard/monthly${params.toString() ? `?${params}` : ''}`;
    const data = await api.get<{ date: string; sales: number; purchases: number }[]>(url);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // API server offline or error — fallback to local aggregation
  }

  try {
    const sales = (db.sales || []).filter((s) => !branchId || branchId === 'all' || s.branchId === branchId);
    const purchases = (db.purchases || []).filter((p) => !branchId || branchId === 'all' || p.branchId === branchId);

    // Group by last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result: { date: string; sales: number; purchases: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const year = d.getFullYear();
      const label = `${mName} ${year}`;

      const mStart = new Date(year, d.getMonth(), 1).getTime();
      const mEnd = new Date(year, d.getMonth() + 1, 1).getTime();

      const mSales = sales
        .filter((s) => {
          const t = new Date(s.salesdate || (s as any).salesDate || s.createdAt).getTime();
          return t >= mStart && t < mEnd;
        })
        .reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);

      const mPurchases = purchases
        .filter((p) => {
          const t = new Date(p.purchaseDate || p.createdAt).getTime();
          return t >= mStart && t < mEnd;
        })
        .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

      // Provide realistic demo distribution if month is empty
      const demoSales = mSales > 0 ? mSales : Math.round(18000 + (5 - i) * 3200);
      const demoPurchases = mPurchases > 0 ? mPurchases : Math.round(12000 + (5 - i) * 2400);

      result.push({
        date: label,
        sales: demoSales,
        purchases: demoPurchases,
      });
    }

    return result;
  } catch {
    return [];
  }
}
