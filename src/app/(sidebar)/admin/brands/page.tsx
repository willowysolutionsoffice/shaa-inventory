// src/app/(admin)/admin/brands/page.tsx
import { BrandsTable } from '@/components/brands/brands-table';
import { BrandFormDialog } from '@/components/brands/brand-form';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { api } from '@/lib/api';
import type { Brand } from '@/actions/brand-actions';

interface BrandsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const resolved = await searchParams;
  const page  = Number(resolved?.page)  || 1;
  const limit = Number(resolved?.limit) || 10;
  const skip  = (page - 1) * limit;

  let brands: Brand[]  = [];
  let totalCount       = 0;

  try {
    const res  = await api.get<any>(`/brands?skip=${skip}&take=${limit}`);
    brands     = res.data  ?? res ?? [];
    totalCount = res.total ?? brands.length;
  } catch (e) {
    console.error('Failed to fetch brands:', e);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
              <p className="text-muted-foreground">Manage your product brands</p>
            </div>
            <BrandFormDialog />
          </div>

          <BrandsTable brands={brands} />

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