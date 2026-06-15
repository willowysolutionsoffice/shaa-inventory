export const dynamic = "force-dynamic";

import { getCategoryList } from "@/actions/category-actions";
import ProductCategoriesClient from "@/components/products/categories/categories-client";

export default async function ProductCategoriesPage() {
  const result = await getCategoryList({ skip: 0, take: 100 });
  const categories = result?.data?.data?.categories ?? [];
  const total      = result?.data?.data?.total ?? 0;

  return <ProductCategoriesClient categories={categories} total={total} />;
}