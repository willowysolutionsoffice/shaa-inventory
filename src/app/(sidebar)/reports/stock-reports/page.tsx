export const dynamic = "force-dynamic";

import { StockReportTable } from "@/components/reports/stock-report-table";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function StockReportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role;
  const branchId = session?.user?.branch;

  const whereClause = role === "admin" ? {} : { branchId };

  // Get all products with their related data
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      brand: true,
      branch: true,
    },
    orderBy: {
      // Ensure consistent ordering
      id: "asc",
    },
  });

  const productIds = products.map((p) => p.id);

  // Get sales data for each product
  const salesData = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
    },
    where: {
      productId: {
        in: productIds,
      },
    },
  });

  // Get sales return data
  const salesReturnData = await prisma.salesReturnItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
    },
    where: {
      productId: {
        in: productIds,
      },
    },
  });

  // Create maps for quick lookup
  const salesMap = new Map(
    salesData.map((item) => [item.productId, item._sum?.quantity || 0])
  );
  const salesReturnMap = new Map(
    salesReturnData.map((item) => [item.productId, item._sum?.quantity || 0])
  );

  // Calculate stock report data
  const stockReport = products.map((product) => {
    const totalSold = salesMap.get(product.id) || 0;
    const totalSalesReturned = salesReturnMap.get(product.id) || 0;

    // Calculate current stock value by purchase price (using excTax as purchase price)
    const currentStockValuePurchase = product.stock * product.purchasePrice;

    // Calculate current stock value by sale price
    const currentStockValueSale = product.stock * product.purchasePrice;

    // Calculate potential profit
    const potentialProfit = currentStockValueSale - currentStockValuePurchase;

    // Calculate total units sold (sales - sales returns)
    const totalUnitSold = totalSold - totalSalesReturned;

    return {
      id: product.id,
      sku: product.sku,
      product_name: product.product_name,
      variation: product.unit, // Using unit as variation for now

      location: product.branch?.name || "No Location",
      unit_selling_price: product.purchasePrice,
      current_stock: product.stock,
      current_stock_value_purchase: currentStockValuePurchase,
      current_stock_value_sale: currentStockValueSale,
      potential_profit: potentialProfit,
      total_unit_sold: totalUnitSold,
      unit: product.unit,
    };
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Stock Report
              </h1>
              <p className="text-muted-foreground">
                Current inventory levels and valuations
              </p>
            </div>
          </div>
          <StockReportTable data={stockReport} />
        </div>
      </div>
    </div>
  );
}
