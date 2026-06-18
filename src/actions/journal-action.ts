'use server';

import { actionClient } from '@/lib/safeAction';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { z } from 'zod';

const journalLineSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required'),
  accountName: z.string().min(1, 'Account name is required'),
  debit:       z.coerce.number().min(0).default(0),
  credit:      z.coerce.number().min(0).default(0),
});

const createJournalSchema = z.object({
  narration: z.string().min(1, 'Narration is required'),
  date:      z.string().min(1, 'Date is required'),
  branchId:  z.string().min(1, 'Branch is required'),
  lines:     z.array(journalLineSchema).min(2, 'At least 2 lines required'),
});

const updateJournalSchema = createJournalSchema.partial().extend({
  id: z.string().min(1),
});

const deleteJournalSchema = z.object({
  id: z.string().min(1),
});

const getJournalByIdSchema = z.object({
  id: z.string().min(1),
});

const postJournalSchema = z.object({
  id: z.string().min(1),
});

const reverseJournalSchema = z.object({
  id: z.string().min(1),
});

const getJournalListSchema = z.object({
  page:     z.coerce.number().optional().default(1),
  limit:    z.coerce.number().optional().default(10),
  branchId: z.string().optional(),
  status:   z.enum(['DRAFT', 'POSTED', 'REVERSED']).optional(),
  from:     z.string().optional(),
  to:       z.string().optional(),
});

function normalizeJournal(v: any): any {
  return {
    ...v,
    lines: (v?.lines ?? []).map((l: any) => ({
      ...l,
      debit:  Number(l.debit),
      credit: Number(l.credit),
    })),
  };
}

export const createJournal = actionClient
  .inputSchema(createJournalSchema)
  .action(async ({ parsedInput }) => {
    try {
      const journal = await api.post<any>('/journals', parsedInput);
      revalidatePath('/admin/journals');
      return { data: normalizeJournal(journal) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const updateJournal = actionClient
  .inputSchema(updateJournalSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...rest } = parsedInput;
      const journal = await api.patch<any>(`/journals/${id}`, rest);
      revalidatePath('/admin/journals');
      return { data: normalizeJournal(journal) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const deleteJournal = actionClient
  .inputSchema(deleteJournalSchema)
  .action(async ({ parsedInput }) => {
    try {
      const journal = await api.delete<any>(`/journals/${parsedInput.id}`);
      revalidatePath('/admin/journals');
      return { data: normalizeJournal(journal) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const postJournal = actionClient
  .inputSchema(postJournalSchema)
  .action(async ({ parsedInput }) => {
    try {
      const journal = await api.post<any>(`/journals/${parsedInput.id}/post`, {});
      revalidatePath('/admin/journals');
      return { data: normalizeJournal(journal) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const reverseJournal = actionClient
  .inputSchema(reverseJournalSchema)
  .action(async ({ parsedInput }) => {
    try {
      const journal = await api.post<any>(`/journals/${parsedInput.id}/reverse`, {});
      revalidatePath('/admin/journals');
      return { data: normalizeJournal(journal) };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });

export const getJournalById = actionClient
  .inputSchema(getJournalByIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const journal = await api.get<any>(`/journals/${parsedInput.id}`);
      return { data: normalizeJournal(journal) };
    } catch (error: any) {
      return { error: error.message ?? 'Journal voucher not found' };
    }
  });

export const getJournalList = actionClient
  .inputSchema(getJournalListSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { page, limit, branchId, status, from, to } = parsedInput;
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(branchId && { branchId }),
        ...(status   && { status }),
        ...(from     && { from }),
        ...(to       && { to }),
      });
      const payload = await api.get<any>(`/journals?${params}`);
      if (payload?.vouchers) {
        payload.vouchers = payload.vouchers.map(normalizeJournal);
      }
      return { data: payload };
    } catch (error: any) {
      return { error: error.message ?? 'Something went wrong' };
    }
  });