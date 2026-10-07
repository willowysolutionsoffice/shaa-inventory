'use server';

import { prisma } from '@/lib/prisma';

export interface ContactReportData {
  id: string;
  name: string;
  type: 'Customer' | 'Supplier';
  totalSales?: number;
  totalSalesReturns?: number;
  totalPurchases?: number;
  totalPurchaseReturns?: number;
  totalPaidAmount: number;
  openingBalance: number;
  balance: number;
}

export interface ContactReportResponse {
  data: ContactReportData[];
  total: number;
}

export interface ContactReportTotals {
  sales?: number;
  purchases?: number;
  paid: number;
  returns: number;
  opening: number;
  balance: number;
}

export async function getCustomerReportData(
  customerId?: string,
  page: number = 1,
  limit: number = 10
): Promise<ContactReportResponse> {
  const skip = (page - 1) * limit;

  const [customerReports, totalCustomers] = await Promise.all([
    prisma.customer.findMany({
      where: customerId ? { id: customerId } : undefined,
      skip,
      take: limit,
      include: {
        sale: {
          select: { grandTotal: true, dueAmount: true, paidAmount: true },
        },
        salesReturn: {
          select: { grandTotal: true },
        },
        BalancePayment: {
          select: { amount: true },
        },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.customer.count({
      where: customerId ? { id: customerId } : undefined,
    }),
  ]);

  const customers = customerReports.map((customer) => {
    const saleArray = customer.sale || [];
    const salesReturnArray = customer.salesReturn || [];
    
    const totalSales = saleArray.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalPaidAmount = saleArray.reduce(
      (acc, p) => acc + p.paidAmount,
      0
    );
    const totalSalesReturns = salesReturnArray.reduce(
      (acc, r) => acc + r.grandTotal,
      0
    );
    const preDueAmount = saleArray.reduce((acc, d) => acc + d.dueAmount, 0);

    let effectiveOpening = customer.openingBalance;
    let effectiveDue = preDueAmount;

    if (effectiveDue < 0) {
      effectiveOpening = Math.max(0, effectiveOpening + effectiveDue);
      effectiveDue = 0;
    }

    return {
      id: customer.id,
      name: customer.name,
      type: 'Customer' as const,
      totalSales,
      totalSalesReturns,
      openingBalance: effectiveOpening,
      totalPaidAmount,
      balance: effectiveDue,
    };
  });

  return { data: customers, total: totalCustomers };
}

export async function getSupplierReportData(
  supplierId?: string,
  page: number = 1,
  limit: number = 10
): Promise<ContactReportResponse> {
  const skip = (page - 1) * limit;

  const [supplierReports, totalSuppliers] = await Promise.all([
    prisma.supplier.findMany({
      where: supplierId ? { id: supplierId } : undefined,
      skip,
      take: limit,
      include: {
        purchase: {
          select: { totalAmount: true, dueAmount: true, paidAmount: true },
        },
        purchaseReturn: {
          select: { totalAmount: true },
        },
        BalancePayment: {
          select: { amount: true },
        },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.supplier.count({
      where: supplierId ? { id: supplierId } : undefined,
    }),
  ]);

  const suppliers = supplierReports.map((supplier) => {
    const purchaseArray = supplier.purchase || [];
    const purchaseReturnArray = supplier.purchaseReturn || [];
    
    const totalPurchases = purchaseArray.reduce(
      (acc, p) => acc + p.totalAmount,
      0
    );
    const totalPaidAmount = purchaseArray.reduce(
      (acc, p) => acc + p.paidAmount,
      0
    );
    const totalPurchaseReturns = purchaseReturnArray.reduce(
      (acc, r) => acc + r.totalAmount,
      0
    );
    const preDueAmount = purchaseArray.reduce(
      (acc, d) => acc + d.dueAmount,
      0
    );

    let effectiveOpening = supplier.openingBalance;
    let effectiveDue = preDueAmount;

    if (effectiveDue < 0) {
      effectiveOpening = Math.max(0, effectiveOpening + effectiveDue);
      effectiveDue = 0;
    }

    return {
      id: supplier.id,
      name: supplier.name,
      type: 'Supplier' as const,
      totalPurchases,
      totalPurchaseReturns,
      totalPaidAmount,
      openingBalance: effectiveOpening,
      balance: effectiveDue,
    };
  });

  return { data: suppliers, total: totalSuppliers };
}

export async function getCustomerGrandTotals(): Promise<ContactReportTotals> {
  const [customerTotals, customerReturnTotal, customerOpeningTotal] =
    await Promise.all([
      prisma.sale.aggregate({
        _sum: {
          grandTotal: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
      prisma.salesReturn.aggregate({
        _sum: {
          grandTotal: true,
        },
      }),
      prisma.customer.aggregate({
        _sum: {
          openingBalance: true,
        },
      }),
    ]);

  return {
    sales: customerTotals._sum.grandTotal || 0,
    paid: customerTotals._sum.paidAmount || 0,
    returns: customerReturnTotal._sum.grandTotal || 0,
    opening: customerOpeningTotal._sum.openingBalance || 0,
    balance: customerTotals._sum.dueAmount || 0,
  };
}

export async function getSupplierGrandTotals(): Promise<ContactReportTotals> {
  const [supplierTotals, supplierReturnTotal, supplierOpeningTotal] =
    await Promise.all([
      prisma.purchase.aggregate({
        _sum: {
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
      prisma.purchaseReturn.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.supplier.aggregate({
        _sum: {
          openingBalance: true,
        },
      }),
    ]);

  return {
    purchases: supplierTotals._sum.totalAmount || 0,
    paid: supplierTotals._sum.paidAmount || 0,
    returns: supplierReturnTotal._sum.totalAmount || 0,
    opening: supplierOpeningTotal._sum.openingBalance || 0,
    balance: supplierTotals._sum.dueAmount || 0,
  };
}

export async function getFilterLists() {
  const [customersList, suppliersList] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { customersList, suppliersList };
}
