export const dynamic = "force-dynamic";

import { StockReportTable } from "@/components/reports/stock-report-table";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { api } from "@/lib/api";
import { getBrandListWithSubBrands } from "@/actions/brand-actions";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { StockReportItem } from "@/actions/stock-report-actions";

export default async function StockReportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role;
  const branchId = session?.user?.branch;

  const whereClause = role === "admin" ? {} : { branchId };

  // 1. Fetch Brands with Sub-Brands and Branches
  const [brandsWithSubs, branches] = await Promise.all([
    getBrandListWithSubBrands().catch(() => []),
    getBranchListForDropdown().catch(() => []),
  ]);

  const brandNameMap = new Map<string, string>();
  const subBrandMap = new Map<string, { id: string; name: string; brandId: string; brandName: string }>();
  const branchNameMap = new Map<string, string>();

  for (const b of brandsWithSubs) {
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

  for (const br of branches) {
    if (br.id) branchNameMap.set(br.id, br.name);
  }

  // 2. Fetch Products
  let products: any[] = [];
  try {
    const apiRes = await api.get<any>("/products?limit=5000");
    const list = apiRes?.products ?? apiRes?.data ?? (Array.isArray(apiRes) ? apiRes : []);
    if (Array.isArray(list) && list.length > 0) {
      products = role === "admin" ? list : list.filter((p: any) => p.branchId === branchId);
    }
  } catch {
    // fallback
  }

  if (products.length === 0) {
    try {
      products = await prisma.product.findMany({
        where: whereClause,
        include: {
          brand: true,
          branch: true,
        },
        orderBy: {
          id: "asc",
        },
      });
    } catch {
      products = [];
    }
  }

  const productIds = products.map((p) => p.id);

  // 3. Sales & Sales Returns
  let salesData: any[] = [];
  let salesReturnData: any[] = [];

  try {
    [salesData, salesReturnData] = await Promise.all([
      prisma.saleItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
        },
        where: {
          productId: {
            in: productIds,
          },
        },
      }),
      prisma.salesReturnItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
        },
        where: {
          productId: {
            in: productIds,
          },
        },
      }),
    ]);
  } catch {
    salesData = [];
    salesReturnData = [];
  }

  const salesMap = new Map(
    salesData.map((item) => [item.productId, item._sum?.quantity || 0])
  );
  const salesReturnMap = new Map(
    salesReturnData.map((item) => [item.productId, item._sum?.quantity || 0])
  );

  // 4. Build Stock Report Data
  const stockReport: StockReportItem[] = products.map((product) => {
    const totalSold = salesMap.get(product.id) || 0;
    const totalSalesReturned = salesReturnMap.get(product.id) || 0;

    const stock = Number(product.stock ?? 0);
    const purchasePrice = Number(product.purchasePrice ?? 0);
    const sellingPrice = Number(product.sellingPrice ?? purchasePrice);

    const currentStockValuePurchase = stock * purchasePrice;
    const currentStockValueSale = stock * sellingPrice;
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
      product_name: product.product_name || product.productName || "Unnamed Product",
      brand_name: brandName,
      sub_brand_name: subBrandName,
      brandId: bId,
      subBrandId: sbId,
      branchId: brId,
      variation: product.unit || "Unit",
      location: branchName,
      unit_purchase_price: purchasePrice,
      unit_selling_price: sellingPrice,
      current_stock: stock,
      current_stock_value_purchase: currentStockValuePurchase,
      current_stock_value_sale: currentStockValueSale,
      potential_profit: potentialProfit,
      total_unit_sold: totalUnitSold,
      unit: product.unit || "pc",
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
