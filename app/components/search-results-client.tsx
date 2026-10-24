"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  getCachedSearchCatalogueIndex,
  loadSearchCatalogueIndex,
  MAX_SEARCH_QUERY_LENGTH,
  SEARCH_CATALOGUE_CACHE_TTL_MS,
  searchCatalogue,
  type SearchCatalogueIndex,
} from "@/lib/search-index";
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
  { value: "relevance", label: "Relevance" },
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

function readSortOption(value: string | null, defaultSort: SortOption): SortOption {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortOption)
    : defaultSort;
}

function sortValue(option: SortOption): { field: SortField; order: SortOrder } | null {
  if (option === "relevance") return null;
  const [sortKey, order] = option.split("-");
  const field: SortField = sortKey === "date" ? "issue_date" : (sortKey as SortField);
  return { field, order: order as SortOrder };
}

const SORT_COLLATOR = new Intl.Collator(undefined, { numeric: true });
const DENOMINATION_TERMS: Record<string, string[]> = {
  anna: ["anna", "annas", "a"],
  paisa: ["p", "paisa", "paise", "np"],
  rupee: ["r", "rupee", "rupees", "rs", "inr"],
};

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
  searchQuery = "",
  themeTitle = "",
}: SearchResultsClientProps) {
  const searchParams = useSearchParams();
  const [catalogue, setCatalogue] = useState<SearchCatalogueIndex | null>(
    getCachedSearchCatalogueIndex,
  );
  const [catalogueError, setCatalogueError] = useState("");
  const [catalogueRefreshError, setCatalogueRefreshError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(
    () => getCachedSearchCatalogueIndex() === null,
  );
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopChanges,
    getIsDesktop,
    getServerIsDesktop,
  );
  const currentQuery = searchParams.toString();
  const activeSearchQuery = searchParams.get("q")?.trim() ?? searchQuery;
  const activeThemeTitle = searchParams.get("themeTitle")?.trim() || themeTitle;
  const previousSearchQuery = useRef(searchQuery);

  const refreshCatalogue = () => {
    setCatalogueRefreshError("");
    void loadSearchCatalogueIndex()
      .then((loadedCatalogue) => {
        setCatalogue(loadedCatalogue);
        setCatalogueError("");
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        setCatalogueRefreshError(
          error instanceof Error
            ? error.message
            : "The search catalogue could not be refreshed.",
        );
      });
  };

  useEffect(() => {
    let isCurrent = true;

    loadSearchCatalogueIndex()
      .then((loadedCatalogue) => {
        if (isCurrent) setCatalogue(loadedCatalogue);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setCatalogueError(
            error instanceof Error
              ? error.message
              : "The search catalogue could not be loaded. Please try again.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  useEffect(() => {
    const refreshIfStale = () => {
      if (document.visibilityState === "visible") refreshCatalogue();
    };
    const intervalId = window.setInterval(
      refreshIfStale,
      Math.min(60_000, SEARCH_CATALOGUE_CACHE_TTL_MS),
    );
    document.addEventListener("visibilitychange", refreshIfStale);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, []);

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
  const defaultSort: SortOption =
    activeSearchQuery && !activeThemeTitle ? "relevance" : "date-desc";
  const sortOption = readSortOption(searchParams.get("sort"), defaultSort);
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
      const resultThemes = new Set(
        Array.from(catalogue?.displayRecords.values() ?? [], (stamp) => stamp.theme),
      );
      return THEME_FILTER_OPTIONS.filter((theme) => resultThemes.has(theme));
    },
    [catalogue],
  );

  const searchResults = useMemo(() => {
    if (!catalogue) return [];

    if (activeThemeTitle) {
      const normalizedTheme = activeThemeTitle.normalize("NFKC").toLowerCase();
      const canonicalTheme = THEME_FILTER_OPTIONS.find(
        (theme) => theme.normalize("NFKC").toLowerCase() === normalizedTheme,
      );
      return canonicalTheme
        ? Array.from(catalogue.displayRecords.values())
            .filter((stamp) => stamp.theme?.normalize("NFKC").toLowerCase() === normalizedTheme)
            .sort((a, b) => (b.issue_date ?? "").localeCompare(a.issue_date ?? ""))
        : [];
    }

    if (!activeSearchQuery) {
      return Array.from(catalogue.displayRecords.values()).sort(
        (a, b) => (b.issue_date ?? "").localeCompare(a.issue_date ?? ""),
      );
    }

    if (activeSearchQuery.length > MAX_SEARCH_QUERY_LENGTH) return [];
    return searchCatalogue(catalogue, activeSearchQuery);
  }, [activeSearchQuery, activeThemeTitle, catalogue]);

  const headingText = activeThemeTitle || (activeSearchQuery ? `Search: "${activeSearchQuery}"` : "Catalog Search");

  const filteredAndSortedStamps = useMemo(() => {
    const normalizedFilters = {
      name: columnFilters.name.trim().toLocaleLowerCase(),
      denomination: columnFilters.denomination.trim().toLocaleLowerCase(),
    };

    const filtered = searchResults.filter((stamp) => {
      if (activeView === "grid") {
        if (!activeThemeTitle && selectedTheme !== "all" && stamp.theme !== selectedTheme) return false;

        if (selectedEra !== "all") {
          const year = Number.parseInt(stamp.issue_date?.substring(0, 4) ?? "", 10);
          const decadeStart = Number.parseInt(selectedEra, 10);
          if (!Number.isFinite(year) || year < decadeStart || year > decadeStart + 9) {
            return false;
          }
        }

        if (selectedDenom !== "all") {
          const denominationTokens = new Set(
            (stamp.denomination?.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []),
          );
          if (!DENOMINATION_TERMS[selectedDenom]?.some((term) => denominationTokens.has(term))) return false;
        }
      }

      if (activeView === "table") {
        const issueYear = Number.parseInt(stamp.issue_date?.substring(0, 4) ?? "", 10);
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

    const selectedSort = sortValue(sortOption);
    if (!selectedSort) return filtered;

    const { field, order } = selectedSort;
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
    searchResults,
    selectedDenom,
    selectedEra,
    selectedTheme,
    sortOption,
    activeThemeTitle,
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
  const noTextMatches =
    !activeThemeTitle && Boolean(activeSearchQuery) && searchResults.length === 0;

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
    updateParams({ sort: nextSort === defaultSort ? null : nextSort }, true);
  };

  const selectedSort = sortValue(sortOption);
  const sortField = selectedSort?.field ?? null;
  const sortOrder = selectedSort?.order ?? "desc";

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600" role="status">
        Loading the stamp catalogue for search…
      </section>
    );
  }

  if (catalogueError || !catalogue) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8 text-center" role="alert">
        <p className="text-sm text-red-700">
          {catalogueError || "The search catalogue could not be loaded."}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setCatalogueError("");
            setRetryCount((count) => count + 1);
          }}
          className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Retry
        </button>
      </section>
    );
  }

  if (activeSearchQuery.length > MAX_SEARCH_QUERY_LENGTH) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-white p-8 text-center text-sm text-amber-800" role="alert">
        Search queries must be {MAX_SEARCH_QUERY_LENGTH} characters or fewer.
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {catalogueRefreshError && (
        <section
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          role="status"
        >
          <p>
            Could not refresh the search catalogue. Previously loaded results are still shown.
          </p>
          <button
            type="button"
            onClick={refreshCatalogue}
            className="rounded-lg border border-amber-300 px-3 py-1.5 font-semibold hover:bg-amber-100"
          >
            Retry refresh
          </button>
        </section>
      )}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              {headingText}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {filteredAndSortedStamps.length}{" "}
              {filteredAndSortedStamps.length === 1 ? "stamp" : "stamps"} found
              {activeSearchQuery && !activeThemeTitle && sortOption === "relevance" && (
                <span> · sorted by relevance</span>
              )}
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
              {!activeThemeTitle && availableThemes.length > 1 && (
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
                onChange={(event) => {
                  const nextSort = event.target.value as SortOption;
                  updateParams({ sort: nextSort === defaultSort ? null : nextSort }, true);
                }}
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
              {noTextMatches
                ? "No stamps matched your search."
                : "No stamps matched the selected criteria."}
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
          emptyMessage={
            noTextMatches
              ? "No stamps matched your search."
              : "No stamps matched the selected criteria."
          }
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
