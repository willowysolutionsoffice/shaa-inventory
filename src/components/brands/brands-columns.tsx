// src/components/brands/brands-columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Brand } from '@/actions/brand-actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BrandColumnsOptions {
  onEdit:        (brand: Brand)  => void;
  onDelete:      (brand: Brand)  => void;
  expandedRows:  Set<string>;
  onToggleRow:   (id: string)    => void;
}

export function getBrandColumns({
  onEdit,
  onDelete,
  expandedRows,
  onToggleRow,
}: BrandColumnsOptions): ColumnDef<Brand>[] {
  return [
    {
      id:     'expand',
      header: '',
      size:   40,
      cell:   ({ row }) => {
        const hasSubBrands = row.original.subBrands?.length > 0;
        const isExpanded   = expandedRows.has(row.original.id);
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onToggleRow(row.original.id)}
            disabled={!hasSubBrands}
          >
            {hasSubBrands
              ? isExpanded
                ? <ChevronDown  className="h-4 w-4 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
              : <span className="h-4 w-4 block" />
            }
          </Button>
        );
      },
    },
    {
      accessorKey: 'name',
      header:      'Brand Name',
      cell:        ({ row }) => (
        <div className="font-medium flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {row.original.name}
          {row.original.subBrands?.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {row.original.subBrands.length}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header:      'Description',
      cell:        ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.description ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header:      'Created',
      cell:        ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id:   'actions',
      header: () => <span className="text-right block">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}