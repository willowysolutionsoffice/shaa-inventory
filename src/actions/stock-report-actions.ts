// src/actions/stock-report-actions.ts
'use server';

import { db } from "@/lib/mock-db";
import { actionClient } from "@/lib/safeAction";

export interface StockReportItem {
  id: string;
  sku: string;
  product_name: string;
  variation?: string;
  location: string;
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
    const products = [...db.products];

    // Calculate total sold per product
    const salesMap = new Map();
    db.saleItems.forEach((item) => {
      const curr = salesMap.get(item.productId) || 0;
      salesMap.set(item.productId, curr + item.quantity);
    });

    // Calculate sales return per product
    const salesReturnMap = new Map();
    db.salesReturnItems.forEach((item) => {
      const curr = salesReturnMap.get(item.productId) || 0;
      salesReturnMap.set(item.productId, curr + item.quantity);
    });

    const stockReport: StockReportItem[] = products.map((product) => {
      const totalSold = salesMap.get(product.id) || 0;
      const totalSalesReturned = salesReturnMap.get(product.id) || 0;

      const currentStockValuePurchase = product.stock * product.purchasePrice;
      const currentStockValueSale = product.stock * product.sellingPrice;
      const potentialProfit = currentStockValueSale - currentStockValuePurchase;
      const totalUnitSold = totalSold - totalSalesReturned;

      const branch = db.branches.find((b) => b.id === product.branchId);

      return {
        id: product.id,
        sku: product.sku,
        product_name: product.product_name,
        variation: (product as any).unit || "Unit",
        location: branch?.name || "No Location",
        unit_selling_price: product.sellingPrice,
        current_stock: product.stock,
        current_stock_value_purchase: currentStockValuePurchase,
        current_stock_value_sale: currentStockValueSale,
        potential_profit: potentialProfit,
        total_unit_sold: totalUnitSold,
        unit: (product as any).unit || "pc",
      };
    });

    return { data: stockReport };
  } catch (error) {
    console.error("Get Stock Report Error:", error);
    return { error: "Something went wrong" };
  }
});
