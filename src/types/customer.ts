// src/types/customer.ts
import { Customer as PrismaCustomer } from '@prisma/client';

export interface Customer extends Omit<PrismaCustomer, 'openingBalance'> {
  branch?: { id: string; name: string } | null;
}

export interface CustomerFormProps {
  customer?: Customer;
  open?:     boolean;
  openChange?: (open: boolean) => void;
}