"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import type { StampSearchResult } from "@/lib/catalog";

export const THEME_FILTER_OPTIONS = [
  "National Symbols & Identity",
  "Leaders & Personalities",
  "Historical Events & Anniversaries",
  "Wildlife & Nature",
  "Art, Culture & Mythology",
  "Science, Technology & Space",
  "Sports & International Relations",
  "Landmarks, Architecture & Heritage Sites",
] as const;

export type ColumnFilters = {
  name: string;
  theme: string[];
  issueDateFrom: string;
  issueDateTo: string;
  denomination: string;
};

export type SortField = "name" | "theme" | "issue_date" | "denomination";
export type SortOrder = "asc" | "desc";

type ResultsTableProps = {
  stamps: StampSearchResult[];
  filters: ColumnFilters;
  sortField: SortField | null;
  sortOrder: SortOrder;
  emptyMessage?: string;
  onFilterChange: (filters: ColumnFilters) => void;
  onSortChange: (field: SortField, order: SortOrder) => void;
};

type FilterColumn = "name" | "theme" | "issue_date" | "denomination";

type ColumnDefinition = {
  key: FilterColumn;
  label: string;
};

const COLUMNS: ColumnDefinition[] = [
  { key: "name", label: "Title / Name" },
  { key: "theme", label: "Category" },
  { key: "issue_date", label: "Date / Year" },
  { key: "denomination", label: "Denomination" },
];

type FilterPopoverProps = {
  column: FilterColumn;
  filters: ColumnFilters;
  onApply: (filters: ColumnFilters) => void;
  onClose: () => void;
};

type PopupPosition = {
  top: number;
  left: number;
};

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={`size-4 ${active ? "text-blue-700" : "text-slate-500"}`}
    >
      <path
        d="M3 4h14l-5.5 6.2v4.3l-3 1.5v-5.8L3 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterPopover({ column, filters, onApply, onClose }: FilterPopoverProps) {
  const [draft, setDraft] = useState(filters);
  const [yearError, setYearError] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const closeAndRestoreFocus = useCallback(() => {
    onClose();
    anchorRef.current?.focus();
  }, [onClose]);

  useEffect(() => {
    const anchor = document.querySelector<HTMLButtonElement>(`[data-filter-column="${column}"]`);
    anchorRef.current = anchor;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 24);
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      });
    };
    updatePosition();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !popupRef.current?.contains(target) &&
        !anchorRef.current?.contains(target)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && popupRef.current?.contains(event.target)) return;
      onClose();
    };
    const handleResize = () => onClose();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [column, closeAndRestoreFocus, onClose]);

  useEffect(() => {
    if (position) focusRef.current?.focus();
  }, [position]);

  const apply = () => {
    if (column === "issue_date") {
      const { issueDateFrom, issueDateTo } = draft;
      const isValidYear = (value: string) => !value || /^\d{4}$/.test(value);
      if (!isValidYear(issueDateFrom) || !isValidYear(issueDateTo)) {
        setYearError("Enter a four-digit year.");
        return;
      }
      if (issueDateFrom && issueDateTo && Number(issueDateFrom) > Number(issueDateTo)) {
        setYearError("The start year must not be later than the end year.");
        return;
      }
    }

    onApply(draft);
    closeAndRestoreFocus();
  };

  const clear = () => {
    const cleared = { ...draft };
    if (column === "name") cleared.name = "";
    if (column === "theme") cleared.theme = [];
    if (column === "issue_date") {
      cleared.issueDateFrom = "";
      cleared.issueDateTo = "";
    }
    if (column === "denomination") cleared.denomination = "";
    setDraft(cleared);
    setYearError("");
    onApply(cleared);
    closeAndRestoreFocus();
  };

  const textInputClass =
    "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  if (!position || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-label={`${COLUMNS.find((item) => item.key === column)?.label} filter`}
      className="fixed z-[100] w-[min(360px,calc(100vw-24px))] rounded-xl border border-slate-200 bg-white p-4 text-left normal-case tracking-normal shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {column === "name" && "Filter title"}
          {column === "theme" && "Filter categories"}
          {column === "issue_date" && "Year range"}
          {column === "denomination" && "Filter denomination"}
        </h3>
        <button
          type="button"
          aria-label="Close filter"
          onClick={closeAndRestoreFocus}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {column === "name" && (
        <input
          ref={focusRef}
          type="search"
          aria-label="Filter title"
          placeholder="e.g. Gandhi, Tagore..."
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply();
          }}
          className={textInputClass}
        />
      )}

      {column === "denomination" && (
        <input
          ref={focusRef}
          type="search"
          aria-label="Filter denomination"
          placeholder="e.g. 2 Rs, 50 p..."
          value={draft.denomination}
          onChange={(event) => setDraft({ ...draft, denomination: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply();
          }}
          className={textInputClass}
        />
      )}

      {column === "theme" && (
        <fieldset className="max-h-64 space-y-2 overflow-y-auto">
          <legend className="sr-only">Select categories</legend>
          {THEME_FILTER_OPTIONS.map((theme, index) => (
            <label key={theme} className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
              <input
                ref={index === 0 ? focusRef : undefined}
                type="checkbox"
                checked={draft.theme.includes(theme)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    theme: event.target.checked
                      ? [...draft.theme, theme]
                      : draft.theme.filter((value) => value !== theme),
                  })
                }
                className="mt-0.5 size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>{theme}</span>
            </label>
          ))}
        </fieldset>
      )}

      {column === "issue_date" && (
        <>
          <div className="flex items-center gap-2">
            <input
              ref={focusRef}
              type="text"
              inputMode="numeric"
              maxLength={4}
              aria-label="Start year"
              placeholder="From year"
              value={draft.issueDateFrom}
              onChange={(event) => {
                setYearError("");
                setDraft({ ...draft, issueDateFrom: event.target.value.replace(/\D/g, "") });
              }}
              className={textInputClass}
            />
            <span className="shrink-0 text-sm text-slate-500">to</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              aria-label="End year"
              placeholder="To year"
              value={draft.issueDateTo}
              onChange={(event) => {
                setYearError("");
                setDraft({ ...draft, issueDateTo: event.target.value.replace(/\D/g, "") });
              }}
              className={textInputClass}
            />
          </div>
          {yearError && <p role="alert" className="mt-2 text-xs text-red-700">{yearError}</p>}
        </>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          Clear filter
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Apply
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function ResultsTable({
  stamps,
  filters,
  sortField,
  sortOrder,
  emptyMessage = "No matching results found for the active filters.",
  onFilterChange,
  onSortChange,
}: ResultsTableProps) {
  const [openFilter, setOpenFilter] = useState<FilterColumn | null>(null);
  const closeFilter = useCallback(() => setOpenFilter(null), []);
  const toggleSort = (field: SortField) =>
    onSortChange(field, sortField === field && sortOrder === "asc" ? "desc" : "asc");

  const hasActiveFilter = (column: FilterColumn) => {
    if (column === "issue_date") return Boolean(filters.issueDateFrom || filters.issueDateTo);
    if (column === "theme") return filters.theme.length > 0;
    return Boolean(filters[column]);
  };

  const buttonFor = (column: FilterColumn) => (
    <button
      type="button"
      data-filter-column={column}
      aria-label={`${hasActiveFilter(column) ? "Edit" : "Open"} ${COLUMNS.find((item) => item.key === column)?.label} filter`}
      aria-haspopup="dialog"
      aria-expanded={openFilter === column}
      onClick={() => setOpenFilter(openFilter === column ? null : column)}
      className={`relative rounded-md p-1.5 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        hasActiveFilter(column) || openFilter === column ? "text-blue-700" : "text-slate-500"
      }`}
    >
      <FilterIcon active={hasActiveFilter(column) || openFilter === column} />
      {hasActiveFilter(column) && (
        <span aria-hidden="true" className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-blue-600" />
      )}
    </button>
  );

  return (
    <div className="min-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="w-20 px-4 py-3 font-semibold">
              Image
            </th>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  sortField === column.key
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="min-w-40 px-4 py-3 font-semibold"
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1 text-left hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    aria-label={`Sort by ${column.label} ${sortField === column.key && sortOrder === "asc" ? "descending" : "ascending"}`}
                  >
                    {column.label}
                    <span aria-hidden="true" className="text-blue-700">
                      {sortField === column.key ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                  {buttonFor(column.key)}
                </div>
              </th>
            ))}
            <th scope="col" className="min-w-32 px-4 py-3 font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {stamps.length ? (
            stamps.map((stamp) => (
              <tr key={stamp.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link href={`/stamp/${stamp.id}`} aria-label={`View ${stamp.name}`}>
                    <span className="relative block size-12 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                      {stamp.image_url ? (
                        <Image
                          src={stamp.image_url}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[9px] text-slate-400">
                          No image
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                <td className="max-w-xs px-4 py-3 font-medium text-slate-900">{stamp.name}</td>
                <td className="px-4 py-3 text-slate-600">{stamp.theme || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {stamp.issue_date || "Unknown date"}
                </td>
                <td className="px-4 py-3 text-slate-600">{stamp.denomination || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/stamp/${stamp.id}`}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={COLUMNS.length + 2} className="px-4 py-12 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {openFilter && (
        <FilterPopover
          key={openFilter}
          column={openFilter}
          filters={filters}
          onApply={onFilterChange}
          onClose={closeFilter}
        />
      )}
    </div>
  );
}
