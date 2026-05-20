'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Settings } from 'lucide-react';
import clsx from 'clsx';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const settingsItems = [
  { title: 'Expense Category', url: '/settings/expensescategory' },
  { title: 'Customers', url: '/settings/customers' },
  { title: 'Supplier', url: '/settings/supplier' },
  { title: 'Branches', url: '/settings/branches' },
];

export function SidebarSettingsDropdown() {
  const pathname = usePathname();
  const isActive = settingsItems.some((item) => pathname.startsWith(item.url));

  return (
    <Collapsible defaultOpen={isActive} className="w-full group/collapsible">
      <CollapsibleTrigger
        className={clsx(
          'flex items-center justify-between w-full px-2 py-2 text-sm rounded-md hover:bg-muted',
          isActive && 'bg-muted'
        )}
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </span>
        <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="ml-6 mt-1 space-y-1 border-border pl-3">
        {settingsItems.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            className={clsx(
              'block text-sm text-muted-foreground hover:text-foreground',
              pathname === item.url && 'text-foreground font-medium'
            )}
          >
            {item.title}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
