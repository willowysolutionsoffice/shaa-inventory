'use server';

import { api } from '@/lib/api';

export async function getMonthlyData(branchId?: string) {
  try {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);

    const url  = `/dashboard/monthly${params.toString() ? `?${params}` : ''}`;
    const data = await api.get<{ date: string; sales: number; purchases: number }[]>(url);
    return data ?? [];
  } catch {
    return [];
  }
}