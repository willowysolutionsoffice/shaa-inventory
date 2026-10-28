// src/actions/stock-report-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { prisma } from "@/lib/prisma";
import { actionClient } from "@/lib/safeAction";
import { api } from "@/lib/api";
import { getBrandListWithSubBrands } from "./brand-actions";
import { getBranchListForDropdown } from "./branch-action";

export interface StockReportItem {
  id: string;
  sku: string;
  product_name: string;
  brand_name: string;
  sub_brand_name: string;
  brandId?: string;
  subBrandId?: string;
  branchId?: string;
  variation?: string;
  location: string;
  unit_purchase_price: number;
  unit_selling_price: number;
  current_stock: number;
  current_stock_value_purchase: number;
  current_stock_value_sale: number;
  potential_profit: number;
  total_unit_sold: number;
  unit: string;
}

export const getStockReportData = actionClient.action(async () => {
  try {
    const [brandsWithSubs, branches] = await Promise.all([
      getBrandListWithSubBrands().catch(() => []),
      getBranchListForDropdown().catch(() => []),
    ]);

    const brandNameMap = new Map<string, string>();
    const subBrandMap = new Map<string, { id: string; name: string; brandId: string; brandName: string }>();
    const branchNameMap = new Map<string, string>();

    const allBrands = brandsWithSubs.length > 0 ? brandsWithSubs : (db.brands as any[]);
    for (const b of allBrands) {
      if (b.id) brandNameMap.set(b.id, b.name);
      if (Array.isArray(b.subBrands)) {
        for (const sb of b.subBrands) {
          subBrandMap.set(sb.id, {
            id: sb.id,
            name: sb.name,
            brandId: b.id,
            brandName: b.name,
          });
        }
      }
    }

    const allBranches = branches.length > 0 ? branches : (db.branches as any[]);
    for (const br of allBranches) {
      if (br.id) branchNameMap.set(br.id, br.name);
    }

    let products: any[] = [];
    try {
      const apiRes = await api.get<any>('/products?limit=5000');
      const list = apiRes?.products ?? apiRes?.data ?? (Array.isArray(apiRes) ? apiRes : []);
      if (Array.isArray(list) && list.length > 0) {
        products = list;
      }
    } catch {
      // fallback to prisma
    }

    if (products.length === 0) {
      try {
        products = await prisma.product.findMany({
          include: { brand: true, branch: true },
          orderBy: { id: "asc" },
        });
      } catch {
        products = [...db.products];
      }
    }

    const salesMap = new Map<string, number>();
    try {
      if (Array.isArray(db.saleItems)) {
        for (const item of db.saleItems) {
          salesMap.set(item.productId, (salesMap.get(item.productId) || 0) + item.quantity);
        }
      }
    } catch {}

    const salesReturnMap = new Map<string, number>();
    try {
      if (Array.isArray(db.salesReturnItems)) {
        for (const item of db.salesReturnItems) {
          salesReturnMap.set(item.productId, (salesReturnMap.get(item.productId) || 0) + item.quantity);
        }
      }
    } catch {}

    const stockReport: StockReportItem[] = products.map((product) => {
      const totalSold = salesMap.get(product.id) || 0;
      const totalSalesReturned = salesReturnMap.get(product.id) || 0;

      const currentStock = Number(product.stock ?? 0);
      const purchasePrice = Number(product.purchasePrice ?? 0);
      const sellingPrice = Number(product.sellingPrice ?? purchasePrice);

      const currentStockValuePurchase = currentStock * purchasePrice;
      const currentStockValueSale = currentStock * sellingPrice;
      const potentialProfit = currentStockValueSale - currentStockValuePurchase;
      const totalUnitSold = totalSold - totalSalesReturned;

      const bId = product.brandId ?? product.brand?.id;
      const sbId = product.subBrandId ?? product.subBrand?.id;
      const brId = product.branchId ?? product.branch?.id;

      const brandName =
        product.brand?.name ??
        (bId ? brandNameMap.get(bId) : undefined) ??
        (sbId ? subBrandMap.get(sbId)?.brandName : undefined) ??
        "Unbranded";

      const subBrandName =
        product.subBrand?.name ??
        (sbId ? subBrandMap.get(sbId)?.name : undefined) ??
        "—";

      const branchName =
        product.branch?.name ??
        (brId ? branchNameMap.get(brId) : undefined) ??
        "Main Location";

      return {
        id: product.id,
        sku: product.sku || `SKU-${product.id}`,
        product_name: product.product_name || product.productName || "Unnamed",
        brand_name: brandName,
        sub_brand_name: subBrandName,
        brandId: bId,
        subBrandId: sbId,
        branchId: brId,
        variation: product.unit || "Unit",
        location: branchName,
        unit_purchase_price: purchasePrice,
        unit_selling_price: sellingPrice,
        current_stock: currentStock,
        current_stock_value_purchase: currentStockValuePurchase,
        current_stock_value_sale: currentStockValueSale,
        potential_profit: potentialProfit,
        total_unit_sold: totalUnitSold,
        unit: product.unit || "pc",
      };
    });

    return { data: stockReport };
  } catch (error: any) {
    console.error("Get Stock Report Error:", error);
    return { error: error.message ?? "Something went wrong" };
  }
});
