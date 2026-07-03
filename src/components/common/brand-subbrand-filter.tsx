// src/components/common/brand-subbrand-filter.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getBrandListForDropdown, getSubBrandsByBrand } from "@/actions/brand-actions";

interface DropdownItem { id: string; name: string }

export function BrandSubBrandFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [brands, setBrands] = useState<DropdownItem[]>([]);
  const [subBrands, setSubBrands] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  const brandId = searchParams.get("brandId") ?? "";
  const subBrandId = searchParams.get("subBrandId") ?? "";

  useEffect(() => {
    getBrandListForDropdown()
      .then(setBrands)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!brandId) { setSubBrands([]); return; }
    getSubBrandsByBrand(brandId).then(setSubBrands).catch(() => setSubBrands([]));
  }, [brandId]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);

    // changing brand invalidates any previously selected sub-brand
    if (key === "brandId") next.delete("subBrandId");

    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={brandId}
        onChange={(e) => updateParam("brandId", e.target.value)}
        disabled={loading}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[130px] disabled:opacity-50"
      >
        <option value="">{loading ? "Brand…" : "All Brands"}</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select
        value={subBrandId}
        onChange={(e) => updateParam("subBrandId", e.target.value)}
        disabled={!brandId}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[130px] disabled:opacity-50"
      >
        <option value="">{brandId ? "All Sub-brands" : "Select brand first"}</option>
        {subBrands.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}