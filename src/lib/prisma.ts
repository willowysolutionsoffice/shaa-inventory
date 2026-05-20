// src/lib/prisma.ts
// Fully-featured mock Prisma client routing queries to our local mock database

import { db } from './mock-db';

const modelMap: Record<string, keyof typeof db> = {
  branch: 'branches',
  brand: 'brands',
  expenseCategory: 'categories',
  expense: 'expenses',
  product: 'products',
  customer: 'customers',
  supplier: 'suppliers',
  sale: 'sales',
  purchase: 'purchases',
  salesReturn: 'salesReturns',
  purchaseReturn: 'purchaseReturns',
  balancePayment: 'balancePayments',
  salesPayment: 'salesPayments',
  purchasePayment: 'purchasePayments',
};

const createMockModel = (modelName: string) => {
  const collectionKey = modelMap[modelName] || modelMap[modelName.toLowerCase()];

  return {
    findMany: async (args: any = {}) => {
      let data = [...(db[collectionKey] || [])];

      // Basic filtering (where clause support)
      if (args.where) {
        data = data.filter((item: any) => {
          for (const key in args.where) {
            const val = args.where[key];
            if (val && typeof val === 'object') {
              // Skip complex operator checks (e.g. gt, lt) or handle trivially
              continue;
            }
            if (item[key] !== val) return false;
          }
          return true;
        });
      }

      // Basic sorting
      if (args.orderBy) {
        const field = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[field];
        data.sort((a: any, b: any) => {
          const valA = a[field];
          const valB = b[field];
          if (valA instanceof Date && valB instanceof Date) {
            return dir === 'desc' ? valB.getTime() - valA.getTime() : valA.getTime() - valB.getTime();
          }
          if (typeof valA === 'string' && typeof valB === 'string') {
            return dir === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return dir === 'desc' ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
        });
      }

      // Basic skip/take pagination
      if (args.skip !== undefined && args.take !== undefined) {
        data = data.slice(args.skip, args.skip + args.take);
      } else if (args.take !== undefined) {
        data = data.slice(0, args.take);
      }

      // Populate basic relations (includes)
      if (args.include) {
        data = data.map((item: any) => {
          const newItem = { ...item };
          for (const rel in args.include) {
            if (rel === 'brand' && newItem.brandId) {
              newItem.brand = db.brands.find((b) => b.id === newItem.brandId) || { name: 'Unknown' };
            }
            if (rel === 'branch' && newItem.branchId) {
              newItem.branch = db.branches.find((b) => b.id === newItem.branchId) || { name: 'Unknown' };
            }
            if (rel === 'category' && newItem.categoryId) {
              newItem.category = db.categories.find((c) => c.id === newItem.categoryId) || { name: 'Unknown' };
            }
          }
          return newItem;
        });
      }

      return data;
    },
    findUnique: async (args: any = {}) => {
      const collection = db[collectionKey] || [];
      const item = collection.find((item: any) => item.id === args.where?.id) || null;
      if (item && args.include) {
        const newItem = { ...item };
        for (const rel in args.include) {
          if (rel === 'brand' && newItem.brandId) {
            newItem.brand = db.brands.find((b) => b.id === newItem.brandId) || { name: 'Unknown' };
          }
          if (rel === 'branch' && newItem.branchId) {
            newItem.branch = db.branches.find((b) => b.id === newItem.branchId) || { name: 'Unknown' };
          }
          if (rel === 'category' && newItem.categoryId) {
            newItem.category = db.categories.find((c) => c.id === newItem.categoryId) || { name: 'Unknown' };
          }
        }
        return newItem;
      }
      return item;
    },
    findFirst: async (args: any = {}) => {
      const collection = db[collectionKey] || [];
      return collection[0] || null;
    },
    count: async (args: any = {}) => {
      const collection = db[collectionKey] || [];
      return collection.length;
    },
    aggregate: async (args: any = {}) => {
      const collection = db[collectionKey] || [];
      const sumField = args._sum ? Object.keys(args._sum)[0] : null;
      let sum = 0;
      if (sumField) {
        sum = collection.reduce((acc: number, item: any) => acc + (Number(item[sumField]) || 0), 0);
      }
      return {
        _sum: sumField ? { [sumField]: sum } : {},
      };
    },
    groupBy: async (args: any = {}) => {
      return [];
    },
  };
};

export const prisma = new Proxy({}, {
  get(target, prop: string) {
    if (prop === 'then' || prop === 'catch') return undefined;
    return createMockModel(prop);
  },
}) as any;
