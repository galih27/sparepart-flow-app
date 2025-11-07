"use client";

import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  canPreviousPage,
  canNextPage,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPreviousPage}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNextPage}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
