// src/app/(sidebar)/admin/sub-brands/page.tsx
import { SubBrandsTable } from '@/components/brands/sub-brands-table';
import { SubBrandFormDialog } from '@/components/brands/subbrand-form';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { api } from '@/lib/api';
import type { SubBrand, Brand } from '@/actions/brand-actions';

interface SubBrandsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SubBrandsPage({ searchParams }: SubBrandsPageProps) {
  const resolved   = await searchParams;
  const page       = Number(resolved?.page)     || 1;
  const limit      = Number(resolved?.limit)    || 10;
  const skip       = (page - 1) * limit;
  const brandFilter = (resolved?.brandId as string) || '';

  let subBrands: SubBrand[]                  = [];
  let totalCount                             = 0;
  let brands: { id: string; name: string }[] = [];

  const sbUrl = brandFilter
    ? `/brands/${brandFilter}/sub-brands?skip=${skip}&take=${limit}`
    : `/brands/sub-brands?skip=${skip}&take=${limit}`;

  const [sbRes, brandsRes] = await Promise.allSettled([
    api.get<any>(sbUrl),
    api.get<any>('/brands?take=200'),
  ]);

  if (sbRes.status === 'fulfilled') {
    const d    = sbRes.value;
    subBrands  = d.data  ?? d ?? [];
    totalCount = d.total ?? subBrands.length;
  } else {
    console.error('Sub-brands fetch failed:', sbRes.reason);
  }

  if (brandsRes.status === 'fulfilled') {
    const d              = brandsRes.value;
    const allBrands: Brand[] = d.data ?? d ?? [];
    brands = allBrands.map((b) => ({ id: b.id, name: b.name }));
  } else {
    console.error('Brands fetch failed:', brandsRes.reason);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sub-brands</h1>
              <p className="text-muted-foreground">Manage sub-brands under each brand</p>
            </div>
            <SubBrandFormDialog brands={brands} />
          </div>

          {/* Table receives brands for the filter dropdown */}
          <SubBrandsTable
            subBrands={subBrands}
            brands={brands}
            activeBrandId={brandFilter}
          />

          <PaginationControls
            totalPages={totalPages}
            hasNextPage={page < totalPages}
            hasPrevPage={page > 1}
            totalCount={totalCount}
          />
        </div>
      </div>
    </div>
  );
}