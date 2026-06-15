// src/components/brands/brand-form.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import z from 'zod';

import { brandSchema } from '@/schemas/brand-schema';
import { createBrand, updateBrand, type Brand } from '@/actions/brand-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface BrandFormDialogProps {
  brand?:       Brand | null;
  open?:        boolean;
  openChange?:  (open: boolean) => void;
}

type FormFields = z.infer<typeof brandSchema>;

export function BrandFormDialog({ brand, open: controlledOpen, openChange }: BrandFormDialogProps) {
  const router  = useRouter();
  const isEdit  = !!brand;
  const [internalOpen, setInternalOpen] = useState(false);

  const open    = controlledOpen ?? internalOpen;
  const setOpen = openChange     ?? setInternalOpen;

  const form = useForm<FormFields>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name:        brand?.name        ?? '',
      description: brand?.description ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      name:        brand?.name        ?? '',
      description: brand?.description ?? '',
    });
  }, [brand]);

  const { execute: execCreate, isExecuting: creating } = useAction(createBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Brand created');
      form.reset({ name: '', description: '' });
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error('Failed to create brand'),
  });

  const { execute: execUpdate, isExecuting: updating } = useAction(updateBrand, {
    onSuccess: ({ data }) => {
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Brand updated');
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error('Failed to update brand'),
  });

  const isExecuting = creating || updating;

  const handleSubmit = (data: FormFields) => {
    if (isEdit && brand) {
      execUpdate({ id: brand.id, ...data });
    } else {
      execCreate(data);
    }
  };

  return (
    <>
      {/* Trigger — only rendered in uncontrolled mode */}
      {controlledOpen === undefined && (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Brand
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Brand' : 'New Brand'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Adidas" disabled={isExecuting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isExecuting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isExecuting}>
                  {isExecuting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}