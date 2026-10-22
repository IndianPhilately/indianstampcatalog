"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { StampSearchResult } from "@/lib/catalog";
import PaginationControls, {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from "@/app/components/pagination-controls";
import ResultsTable, {
  type ColumnFilters,
  type SortField,
  type SortOrder,
  THEME_FILTER_OPTIONS,
} from "@/app/components/results-table";
import ViewToggle, { type ViewMode } from "@/app/components/view-toggle";

type SearchResultsClientProps = {
  initialStamps: StampSearchResult[];
  searchQuery?: string;
  themeTitle?: string;
};

function readPageSize(value: string | null): PageSize {
  if (value === "all") return "all";
  const parsed = Number(value);
  const matchedSize = PAGE_SIZE_OPTIONS.find((option) => option === parsed);
  return typeof matchedSize === "number" ? matchedSize : DEFAULT_PAGE_SIZE;
}

const SORT_OPTIONS = [
  { value: "date-asc", label: "Oldest first" },
  { value: "date-desc", label: "Newest first" },
  { value: "name-asc", label: "Title (A–Z)" },
  { value: "name-desc", label: "Title (Z–A)" },
  { value: "theme-asc", label: "Category (A–Z)" },
  { value: "theme-desc", label: "Category (Z–A)" },
  { value: "denomination-asc", label: "Denomination (A–Z)" },
  { value: "denomination-desc", label: "Denomination (Z–A)" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

function readSortOption(value: string | null): SortOption {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortOption)
    : "date-desc";
}

function sortValue(option: SortOption): { field: SortField; order: SortOrder } {
  const [sortKey, order] = option.split("-");
  const field: SortField = sortKey === "date" ? "issue_date" : (sortKey as SortField);
  return { field, order: order as SortOrder };
}

const SORT_COLLATOR = new Intl.Collator(undefined, { numeric: true });

function subscribeToDesktopChanges(callback: () => void) {
  const mediaQuery = window.matchMedia("(min-width: 768px)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getIsDesktop() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getServerIsDesktop() {
  return false;
}

function writeSearchParams(
  currentQuery: string,
  updates: Record<string, string | null>,
  historyMode: "push" | "replace" = "push",
) {
  const params = new URLSearchParams(currentQuery);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (historyMode === "push") {
    window.history.pushState(null, "", url);
  } else {
    window.history.replaceState(null, "", url);
  }
}

export default function SearchResultsClient({
  initialStamps = [],
  searchQuery = "",
  themeTitle = "",
}: SearchResultsClientProps) {
  const searchParams = useSearchParams();
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopChanges,
    getIsDesktop,
    getServerIsDesktop,
  );
  const currentQuery = searchParams.toString();
  const previousSearchQuery = useRef(searchQuery);

  useEffect(() => {
    if (previousSearchQuery.current !== searchQuery) {
      previousSearchQuery.current = searchQuery;
      writeSearchParams(currentQuery, { page: null }, "replace");
    }
  }, [currentQuery, searchQuery]);

  const viewValue = searchParams.get("view");
  const view: ViewMode = viewValue === "table" ? "table" : "grid";
  const activeView: ViewMode = isDesktop ? view : "grid";
  const pageValue = Number(searchParams.get("page") || "1");
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const pageSize = readPageSize(searchParams.get("limit"));
  const selectedTheme = searchParams.get("theme") || "all";
  const selectedEra = searchParams.get("era") || "all";
  const selectedDenom = searchParams.get("denom") || "all";
  const sortOption = readSortOption(searchParams.get("sort"));
  const filterCategoryValue = searchParams.get("filterCategory") || "";
  const requestedThemes = useMemo(
    () =>
      filterCategoryValue
        .split(",")
        .filter((theme): theme is (typeof THEME_FILTER_OPTIONS)[number] =>
          THEME_FILTER_OPTIONS.includes(theme as (typeof THEME_FILTER_OPTIONS)[number]),
        ),
    [filterCategoryValue],
  );
  const columnFilters: ColumnFilters = {
    name: searchParams.get("filterName") || "",
    theme: requestedThemes,
    issueDateFrom: searchParams.get("filterYearFrom") || "",
    issueDateTo: searchParams.get("filterYearTo") || "",
    denomination: searchParams.get("filterDenomination") || "",
  };

  const availableThemes = useMemo(
    () => {
      const resultThemes = new Set(initialStamps.map((stamp) => stamp.theme));
      return THEME_FILTER_OPTIONS.filter((theme) => resultThemes.has(theme));
    },
    [initialStamps],
  );

  const headingText = themeTitle || (searchQuery ? `Search: "${searchQuery}"` : "Catalog Search");

  const filteredAndSortedStamps = useMemo(() => {
    const normalizedFilters = {
      name: columnFilters.name.trim().toLocaleLowerCase(),
      denomination: columnFilters.denomination.trim().toLocaleLowerCase(),
    };

    const filtered = initialStamps.filter((stamp) => {
      if (activeView === "grid") {
        if (!themeTitle && selectedTheme !== "all" && stamp.theme !== selectedTheme) return false;

        if (selectedEra !== "all" && stamp.issue_date) {
          const year = Number.parseInt(stamp.issue_date.substring(0, 4), 10);
          if (!Number.isNaN(year)) {
            const decadeStart = Number.parseInt(selectedEra, 10);
            if (year < decadeStart || year > decadeStart + 9) return false;
          }
        }

        if (selectedDenom !== "all") {
          const denomination = (stamp.denomination || "").toLowerCase();
          if (
            (selectedDenom === "anna" && !denomination.includes("anna") && !denomination.includes("a")) ||
            (selectedDenom === "paisa" && !denomination.includes("p") && !denomination.includes("paisa")) ||
            (selectedDenom === "rupee" &&
              !denomination.includes("r") &&
              !denomination.includes("rupee") &&
              !denomination.includes("rs"))
          ) {
            return false;
          }
        }
      }

      if (activeView === "table") {
        const issueYear = Number.parseInt(stamp.issue_date.substring(0, 4), 10);
        const hasYearRange = columnFilters.issueDateFrom || columnFilters.issueDateTo;
        if (
          hasYearRange &&
          (!Number.isFinite(issueYear) ||
            (columnFilters.issueDateFrom && issueYear < Number(columnFilters.issueDateFrom)) ||
            (columnFilters.issueDateTo && issueYear > Number(columnFilters.issueDateTo)))
        ) {
          return false;
        }

        if (
          !stamp.name.toLocaleLowerCase().includes(normalizedFilters.name) ||
          (requestedThemes.length && !requestedThemes.some((theme) => theme === stamp.theme)) ||
          !(stamp.denomination || "").toLocaleLowerCase().includes(normalizedFilters.denomination)
        ) {
          return false;
        }
      }

      return true;
    });

    const { field, order } = sortValue(sortOption);
    return filtered.sort((a, b) => {
      const aValue = a[field] || "";
      const bValue = b[field] || "";
      const comparison = SORT_COLLATOR.compare(aValue, bValue);
      return order === "asc" ? comparison : -comparison;
    });
  }, [
    columnFilters.denomination,
    columnFilters.issueDateFrom,
    columnFilters.issueDateTo,
    columnFilters.name,
    requestedThemes,
    initialStamps,
    selectedDenom,
    selectedEra,
    selectedTheme,
    sortOption,
    themeTitle,
    activeView,
  ]);

  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(filteredAndSortedStamps.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const displayedStamps =
    pageSize === "all"
      ? filteredAndSortedStamps
      : filteredAndSortedStamps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const updateParams = (
    updates: Record<string, string | null>,
    resetPage = false,
    historyMode: "push" | "replace" = "push",
  ) => {
    writeSearchParams(currentQuery, { ...updates, ...(resetPage ? { page: null } : {}) }, historyMode);
  };

  const updateColumnFilter = (filters: ColumnFilters) => {
    updateParams(
      {
        filterName: filters.name,
        filterCategory: filters.theme.join(","),
        filterYearFrom: filters.issueDateFrom,
        filterYearTo: filters.issueDateTo,
        filterDenomination: filters.denomination,
      },
      true,
      "replace",
    );
  };

  const updateSort = (field: SortField, order: SortOrder) => {
    const sortKey = field === "issue_date" ? "date" : field;
    const nextSort = `${sortKey}-${order}` as SortOption;
    updateParams({ sort: nextSort === "date-desc" ? null : nextSort });
  };

  const { field: sortField, order: sortOrder } = sortValue(sortOption);

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              {headingText}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {filteredAndSortedStamps.length}{" "}
              {filteredAndSortedStamps.length === 1 ? "stamp" : "stamps"} found
            </p>
          </div>
          <ViewToggle
            view={activeView}
            onChange={(nextView) => {
              updateParams(
                { view: nextView === "grid" ? null : nextView },
                true,
              );
            }}
          />
        </div>

        {activeView === "grid" && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {!themeTitle && availableThemes.length > 1 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="themeSelect" className="text-slate-500 font-medium shrink-0">
                    Theme:
                  </label>
                  <select
                    id="themeSelect"
                    value={selectedTheme}
                    onChange={(event) =>
                      updateParams({ theme: event.target.value === "all" ? null : event.target.value }, true)
                    }
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
                  >
                    <option value="all">All Themes</option>
                    {availableThemes.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor="eraSelect" className="text-slate-500 font-medium shrink-0">
                  Decade:
                </label>
                <select
                  id="eraSelect"
                  value={selectedEra}
                  onChange={(event) =>
                    updateParams({ era: event.target.value === "all" ? null : event.target.value }, true)
                  }
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
                >
                  <option value="all">All Decades</option>
                  <option value="1940s">1940s</option>
                  <option value="1950s">1950s</option>
                  <option value="1960s">1960s</option>
                  <option value="1970s">1970s</option>
                  <option value="1980s">1980s</option>
                  <option value="1990s">1990s</option>
                  <option value="2000s">2000s</option>
                  <option value="2010s">2010s</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="denomSelect" className="text-slate-500 font-medium shrink-0">
                  Denomination:
                </label>
                <select
                  id="denomSelect"
                  value={selectedDenom}
                  onChange={(event) =>
                    updateParams({ denom: event.target.value === "all" ? null : event.target.value }, true)
                  }
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
                >
                  <option value="all">All Currency</option>
                  <option value="anna">Annas / Pies</option>
                  <option value="paisa">Paisa</option>
                  <option value="rupee">Rupees (₹)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sortSelect" className="text-slate-500 font-medium shrink-0">
                Sort by:
              </label>
              <select
                id="sortSelect"
                value={sortOption}
                onChange={(event) => updateParams({ sort: event.target.value === "date-desc" ? null : event.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {activeView === "grid" && (
        <section
          aria-label="Search results"
          className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5"
        >
          {displayedStamps.map((stamp) => (
            <Link
              key={stamp.id}
              href={`/stamp/${stamp.id}`}
              className="group flex flex-col bg-white rounded-xl border border-slate-200/90 p-2.5 hover:border-blue-400 hover:shadow-md transition duration-150"
            >
              <div className="relative w-full h-[180px] rounded-lg bg-[#F1F4F7] flex items-center justify-center p-2 overflow-hidden border border-slate-100">
                {stamp.image_url ? (
                  <Image
                    src={stamp.image_url}
                    alt={stamp.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Image unavailable</span>
                )}
              </div>

              <div className="pt-2 text-center flex-1 flex flex-col justify-between">
                <div>
                  <time className="block text-[11px] text-slate-500 leading-tight">
                    {stamp.issue_date || "Unknown date"}
                  </time>
                  <h2
                    className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-2 mt-0.5"
                    title={stamp.name}
                  >
                    {stamp.name}
                  </h2>
                </div>
                {stamp.denomination && (
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{stamp.denomination}</p>
                )}
              </div>
            </Link>
          ))}
          {!displayedStamps.length && (
            <p className="col-span-full bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-500 text-sm">
              No stamps matched the selected criteria.
            </p>
          )}
        </section>
      )}

      {activeView === "table" && (
        <ResultsTable
          stamps={displayedStamps}
          filters={columnFilters}
          sortField={sortField}
          sortOrder={sortOrder}
          onFilterChange={updateColumnFilter}
          onSortChange={updateSort}
        />
      )}

      {filteredAndSortedStamps.length >= 12 && (
        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAndSortedStamps.length}
          onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          onPageSizeChange={(nextSize) =>
            updateParams({ limit: nextSize === DEFAULT_PAGE_SIZE ? null : String(nextSize) }, true)
          }
        />
      )}
    </div>
  );
}
