'use client';

import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteBrand, deleteSubBrand, type Brand, type SubBrand } from '@/actions/brand-actions';

// ── Delete Brand ──────────────────────────────────────────────────────────────

interface DeleteBrandDialogProps {
  brand:         Brand | null;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onSuccess?:    () => void;
}

export function DeleteBrandDialog({
  brand,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBrandDialogProps) {
  const router = useRouter();

  const { execute, isExecuting } = useAction(deleteBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Brand deleted');
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete brand'),
  });

  if (!brand) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{brand.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the brand
            {brand.subBrands?.length > 0 && (
              <> and its <strong>{brand.subBrands.length}</strong> sub-brand{brand.subBrands.length !== 1 ? 's' : ''}</>
            )}.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isExecuting}
            onClick={() => execute({ id: brand.id })}
          >
            {isExecuting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Delete Sub-Brand ──────────────────────────────────────────────────────────

interface DeleteSubBrandDialogProps {
  subBrand:      SubBrand | null;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onSuccess?:    () => void;
}

export function DeleteSubBrandDialog({
  subBrand,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSubBrandDialogProps) {
  const router = useRouter();

  const { execute, isExecuting } = useAction(deleteSubBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Sub-brand deleted');
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete sub-brand'),
  });

  if (!subBrand) return null;

  // deleteSubBrandSchema expects id as "brandId::subBrandId"
  const handleDelete = () => execute({ id: `${subBrand.brandId}::${subBrand.id}` });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{subBrand.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this sub-brand. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isExecuting}
            onClick={handleDelete}
          >
            {isExecuting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}