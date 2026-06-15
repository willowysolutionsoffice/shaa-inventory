// src/components/brands/subbrand-form.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import z from 'zod';

import { subBrandSchema, updateSubBrandSchema } from '@/schemas/brand-schema';
import { createSubBrand, updateSubBrand, type SubBrand } from '@/actions/brand-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface SubBrandFormDialogProps {
  brands:        { id: string; name: string }[];
  subBrand?:     SubBrand | null;   // present = edit mode
  open?:         boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?:    () => void;
}

type CreateFields = z.infer<typeof subBrandSchema>;
type EditFields   = z.infer<typeof updateSubBrandSchema>;

export function SubBrandFormDialog({
  brands,
  subBrand,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: SubBrandFormDialogProps) {
  const router  = useRouter();
  const isEdit  = !!subBrand;

  const [internalOpen, setInternalOpen] = useState(false);
  const open    = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange   ?? setInternalOpen;

  // ── Create form ────────────────────────────────────────────────────────────
  const createForm = useForm<CreateFields>({
    resolver: zodResolver(subBrandSchema),
    defaultValues: { name: '', description: '', brandId: '' },
  });

  // ── Edit form ──────────────────────────────────────────────────────────────
  const editForm = useForm<EditFields>({
    resolver: zodResolver(updateSubBrandSchema),
    defaultValues: {
      id:          subBrand?.id          ?? '',
      name:        subBrand?.name        ?? '',
      description: subBrand?.description ?? '',
      brandId:     subBrand?.brandId     ?? '',
    },
  });

  useEffect(() => {
    if (subBrand) {
      editForm.reset({
        id:          subBrand.id,
        name:        subBrand.name,
        description: subBrand.description ?? '',
        brandId:     subBrand.brandId,
      });
    } else {
      createForm.reset({ name: '', description: '', brandId: '' });
    }
  }, [subBrand]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const { execute: execCreate, isExecuting: creating } = useAction(createSubBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Sub-brand created');
      setOpen(false);
      createForm.reset({ name: '', description: '', brandId: '' });
      router.refresh();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create sub-brand'),
  });

  const { execute: execUpdate, isExecuting: updating } = useAction(updateSubBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Sub-brand updated');
      setOpen(false);
      router.refresh();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update sub-brand'),
  });

  const isExecuting = creating || updating;

  const handleCreate = (data: CreateFields) => execCreate(data);
  const handleEdit   = (data: EditFields)   => execUpdate(data);

  // ── Shared fields renderer ─────────────────────────────────────────────────
  const renderFields = (control: any, register: any) => (
    <>
      {/* Hidden id for edit */}
      {isEdit && <input type="hidden" {...register('id')} />}

      {/* Brand dropdown */}
      <FormField
        control={control}
        name="brandId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isExecuting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sub-brand Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Premium Line" disabled={isExecuting} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Description{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Short description" disabled={isExecuting} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button (uncontrolled mode only) */}
      {controlledOpen === undefined && (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Sub-brand
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Sub-brand' : 'New Sub-brand'}</DialogTitle>
          </DialogHeader>

          {isEdit ? (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                {renderFields(editForm.control, editForm.register)}
                <DialogFooter>
                  <Button type="button" variant="outline" disabled={isExecuting} onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isExecuting}>
                    {updating ? 'Saving...' : 'Update'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                {renderFields(createForm.control, createForm.register)}
                <DialogFooter>
                  <Button type="button" variant="outline" disabled={isExecuting} onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isExecuting}>
                    {creating ? 'Saving...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}