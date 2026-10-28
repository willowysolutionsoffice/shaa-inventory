"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Layers } from "lucide-react";

export interface BranchDropdownItem {
  id: string;
  name: string;
}

interface BranchHeaderSelectorProps {
  branches: BranchDropdownItem[];
  selectedBranchId?: string;
}

export function BranchHeaderSelector({
  branches,
  selectedBranchId,
}: BranchHeaderSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleBranchChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("branchId");
      } else {
        params.set("branchId", value);
      }
      const query = params.toString();
      router.push(`/dashboard${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={selectedBranchId || "all"}
        onValueChange={handleBranchChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-9 text-xs bg-card border-border shadow-xs hover:bg-muted/50 transition-colors w-[180px] sm:w-[220px]">
          <div className="flex items-center gap-2 truncate">
            <Store className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <SelectValue placeholder="All Branches" />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="all" className="text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>All Branches</span>
            </div>
          </SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              <div className="flex items-center gap-2 truncate">
                <Store className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span className="truncate">{b.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
