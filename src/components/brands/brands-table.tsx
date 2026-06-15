// src/components/brands/brands-table.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, Pencil, Trash2, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { deleteBrand, type Brand } from '@/actions/brand-actions';
import { BrandFormDialog } from './brand-form';

interface BrandsTableProps {
  brands: Brand[];
}

export function BrandsTable({ brands }: BrandsTableProps) {
  const router = useRouter();

  const [search,        setSearch]        = useState('');
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [editBrand,     setEditBrand]     = useState<Brand | null>(null);

  const { execute: execDelete } = useAction(deleteBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Brand deleted');
      setBrandToDelete(null);
      router.refresh();
    },
    onError:   () => toast.error('Failed to delete brand'),
    onSettled: () => setIsDeleting(false),
  });

  const filtered = useMemo(() => {
    if (!search) return brands;
    const q = search.toLowerCase();
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q),
    );
  }, [brands, search]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Brands</CardTitle>
            <CardDescription>Total: {brands.length}</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No brands found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                          {brand.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {brand.description ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(brand.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditBrand(brand)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setBrandToDelete(brand)}
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
      {editBrand && (
        <BrandFormDialog
          brand={editBrand}
          open={!!editBrand}
          openChange={(o) => { if (!o) setEditBrand(null); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!brandToDelete} onOpenChange={(o) => { if (!o) setBrandToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold">{brandToDelete?.name}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!brandToDelete) return;
                setIsDeleting(true);
                execDelete({ id: brandToDelete.id });
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