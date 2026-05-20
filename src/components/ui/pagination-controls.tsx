"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationControlsProps {
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCount: number;
}

export function PaginationControls({
  totalPages,
  hasNextPage,
  hasPrevPage,
  totalCount,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = searchParams.get("page") ?? "1";
  const per_page = searchParams.get("limit") ?? "10";
  const currentPage = Number(page);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * Number(per_page) + 1} to{" "}
        {Math.min(currentPage * Number(per_page), totalCount)} of {totalCount}{" "}
        entries
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => {
            router.push(`?page=${currentPage - 1}&limit=${per_page}`);
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => {
            router.push(`?page=${currentPage + 1}&limit=${per_page}`);
          }}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
