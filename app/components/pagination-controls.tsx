"use client";

export const PAGE_SIZE_OPTIONS = [12, 24, 48, "all"] as const;
export const DEFAULT_PAGE_SIZE = 12;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  pageSize: PageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
};

export default function PaginationControls({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => startPage + index,
  );
  const firstItem = totalItems === 0 ? 0 : pageSize === "all" ? 1 : (page - 1) * pageSize + 1;
  const lastItem = pageSize === "all" ? totalItems : Math.min(page * pageSize, totalItems);
  const buttonClass =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

  return (
    <nav
      aria-label="Search result pages"
      className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
        <label className="flex items-center gap-2">
          Items per page
          <select
            value={pageSize}
            onChange={(event) => {
              const value = event.target.value;
              const selectedSize = PAGE_SIZE_OPTIONS.find((option) => String(option) === value);
              if (selectedSize !== undefined) onPageSizeChange(selectedSize);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All" : option}
              </option>
            ))}
          </select>
        </label>
        <span>
          Showing {firstItem}–{lastItem} of {totalItems}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === page ? "page" : undefined}
            aria-label={`Go to page ${pageNumber}`}
            className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              pageNumber === page
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
