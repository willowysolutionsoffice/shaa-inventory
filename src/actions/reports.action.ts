'use server';

import { actionClient } from '@/lib/safeAction';
import { api } from '@/lib/api';
import { z } from 'zod';

const reportParamsSchema = z.object({
  from:     z.string().optional(),
  to:       z.string().optional(),
  branchId: z.string().optional(),
});

const ledgerParamsSchema = reportParamsSchema.extend({
  accountCode: z.string().min(1, 'Account code is required'),
});

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return query.toString();
}

export const getTrialBalance = actionClient
  .inputSchema(reportParamsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const qs = buildQuery(parsedInput);
      const report = await api.get<any>(`/reports/trial-balance${qs ? `?${qs}` : ''}`);
      return { data: report };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getLedger = actionClient
  .inputSchema(ledgerParamsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const qs = buildQuery(parsedInput);
      const report = await api.get<any>(`/reports/ledger${qs ? `?${qs}` : ''}`);
      return { data: report };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getBalanceSheet = actionClient
  .inputSchema(reportParamsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const qs = buildQuery(parsedInput);
      const report = await api.get<any>(`/reports/balance-sheet${qs ? `?${qs}` : ''}`);
      return { data: report };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getGstReport = actionClient
  .inputSchema(reportParamsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const qs = buildQuery(parsedInput);
      const report = await api.get<any>(`/reports/gst${qs ? `?${qs}` : ''}`);
      return { data: report };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });