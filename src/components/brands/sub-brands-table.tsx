// src/components/brands/sub-brands-table.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MoreHorizontal, Pencil, Trash2, Layers, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { deleteSubBrand, type SubBrand } from '@/actions/brand-actions';
import { SubBrandFormDialog } from './subbrand-form';

interface SubBrandsTableProps {
  subBrands:     SubBrand[];
  brands:        { id: string; name: string }[];
  activeBrandId?: string;
}

export function SubBrandsTable({ subBrands, brands, activeBrandId = '' }: SubBrandsTableProps) {
  const router        = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();

  const [search,     setSearch]     = useState('');
  const [sbToDelete, setSbToDelete] = useState<SubBrand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editSb,     setEditSb]     = useState<SubBrand | null>(null);

  // ── Brand filter via URL ───────────────────────────────────────────────────
  const updateBrandFilter = useCallback((brandId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (brandId && brandId !== 'all') {
      params.set('brandId', brandId);
    } else {
      params.delete('brandId');
    }
    params.delete('page'); // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // ── Local text search (client-side, within current page) ──────────────────
  const filtered = useMemo(() => {
    if (!search) return subBrands;
    const q = search.toLowerCase();
    return subBrands.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.brand?.name?.toLowerCase().includes(q),
    );
  }, [subBrands, search]);

  const { execute: execDelete } = useAction(deleteSubBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Sub-brand deleted');
      setSbToDelete(null);
      router.refresh();
    },
    onError:   () => toast.error('Failed to delete sub-brand'),
    onSettled: () => setIsDeleting(false),
  });

  const activeBrandName = brands.find((b) => b.id === activeBrandId)?.name;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Sub-brands</CardTitle>
            <CardDescription>
              {activeBrandId
                ? <>Showing sub-brands for <span className="font-medium text-foreground">{activeBrandName}</span></>
                : `Total: ${subBrands.length}`
              }
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Brand filter */}
            <div className="flex items-center gap-1">
              <Select
                value={activeBrandId || 'all'}
                onValueChange={updateBrandFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeBrandId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => updateBrandFilter('all')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Text search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sub-brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {activeBrandId
                        ? `No sub-brands found for ${activeBrandName}`
                        : 'No sub-brands found'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((sb) => (
                    <TableRow key={sb.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                          {sb.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sb.brand?.name ?? brands.find((b) => b.id === sb.brandId)?.name ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sb.description ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(sb.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditSb(sb)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setSbToDelete(sb)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editSb && (
        <SubBrandFormDialog
          brands={brands}
          subBrand={editSb}
          open={!!editSb}
          onOpenChange={(o) => { if (!o) setEditSb(null); }}
          onSuccess={() => setEditSb(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!sbToDelete} onOpenChange={(o) => { if (!o) setSbToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold">{sbToDelete?.name}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!sbToDelete) return;
                setIsDeleting(true);
                execDelete({ id: `${sbToDelete.brandId}::${sbToDelete.id}` });
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}