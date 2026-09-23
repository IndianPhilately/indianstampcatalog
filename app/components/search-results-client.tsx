"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type StampSearchResult = {
  id: string | number;
  name: string;
  issue_date?: string | null;
  denomination?: string | null;
  theme?: string | null; // Re-add theme
  image_url?: string | null;
};

type SearchResultsClientProps = {
  initialStamps: StampSearchResult[];
  searchQuery?: string;
  themeTitle?: string;
};

export default function SearchResultsClient({
  initialStamps = [],
  searchQuery = "",
  themeTitle = "",
}: SearchResultsClientProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedDenom, setSelectedDenom] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("date-desc");

  // Extract unique available themes dynamically from the search results
  const availableThemes = useMemo(() => {
    return Array.from(
      new Set(
        initialStamps
          .map((s) => s.theme)
          .filter((t): t is string => Boolean(t))
      )
    ).sort();
  }, [initialStamps]);

  const headingText = themeTitle || (searchQuery ? `Search: "${searchQuery}"` : "Catalog Search");

  const filteredStamps = useMemo(() => {
    let list = initialStamps.filter((stamp) => {
      // 1. Theme Filter (Only active if no themeTitle is locked)
      if (!themeTitle && selectedTheme !== "all" && stamp.theme !== selectedTheme) {
        return false;
      }

      // 2. Decade / Era Filter
      if (selectedEra !== "all" && stamp.issue_date) {
        const year = parseInt(stamp.issue_date.substring(0, 4), 10);
        if (!isNaN(year)) {
          if (selectedEra === "1940s" && (year < 1940 || year > 1949)) return false;
          if (selectedEra === "1950s" && (year < 1950 || year > 1959)) return false;
          if (selectedEra === "1960s" && (year < 1960 || year > 1969)) return false;
          if (selectedEra === "1970s" && (year < 1970 || year > 1979)) return false;
          if (selectedEra === "1980s" && (year < 1980 || year > 1989)) return false;
          if (selectedEra === "1990s" && (year < 1990 || year > 1999)) return false;
          if (selectedEra === "2000s" && (year < 2000 || year > 2009)) return false;
          if (selectedEra === "2010s" && (year < 2010 || year > 2019)) return false;
        }
      }

      // 3. Denomination Filter
      if (selectedDenom !== "all") {
        const d = (stamp.denomination || "").toLowerCase();
        if (selectedDenom === "anna" && !d.includes("anna") && !d.includes("a")) return false;
        if (selectedDenom === "paisa" && !d.includes("p") && !d.includes("paisa")) return false;
        if (selectedDenom === "rupee" && !d.includes("r") && !d.includes("rupee") && !d.includes("rs")) return false;
      }

      return true;
    });

    // 4. Sorting
    list = [...list].sort((a, b) => {
      if (sortOption === "date-asc") {
        return (a.issue_date || "").localeCompare(b.issue_date || "");
      }
      if (sortOption === "date-desc") {
        return (b.issue_date || "").localeCompare(a.issue_date || "");
      }
      if (sortOption === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });

    return list;
  }, [initialStamps, selectedTheme, selectedEra, selectedDenom, sortOption, themeTitle]);

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              {headingText}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Showing {filteredStamps.length} stamps found
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Dynamic Theme Filter: Only shown for general keyword searches */}
            {!themeTitle && availableThemes.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="themeSelect" className="text-slate-500 font-medium shrink-0">
                  Theme:
                </label>
                <select
                  id="themeSelect"
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
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

            {/* Decade Select */}
            <div className="flex items-center gap-2">
              <label htmlFor="eraSelect" className="text-slate-500 font-medium shrink-0">
                Decade:
              </label>
              <select
                id="eraSelect"
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
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

            {/* Currency Select */}
            <div className="flex items-center gap-2">
              <label htmlFor="denomSelect" className="text-slate-500 font-medium shrink-0">
                Denomination:
              </label>
              <select
                id="denomSelect"
                value={selectedDenom}
                onChange={(e) => setSelectedDenom(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
              >
                <option value="all">All Currency</option>
                <option value="anna">Annas / Pies</option>
                <option value="paisa">Paisa</option>
                <option value="rupee">Rupees (₹)</option>
              </select>
            </div>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="sortSelect" className="text-slate-500 font-medium shrink-0">
              Sort by:
            </label>
            <select
              id="sortSelect"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Title (A–Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid of Results */}
      {filteredStamps.length > 0 ? (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredStamps.map((stamp) => (
            <Link
              key={stamp.id}
              href={`/stamp/${stamp.id}`}
              className="group flex flex-col bg-white rounded-xl border border-slate-200/90 p-2.5 hover:border-blue-400 hover:shadow-md transition duration-150"
            >
              <div className="w-full h-[180px] rounded-lg bg-[#F1F4F7] flex items-center justify-center p-2 overflow-hidden border border-slate-100">
                <img
                  src={stamp.image_url || "https://indianstampcatalog.vercel.app/favicon.ico"}
                  alt={stamp.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-200"
                />
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
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {stamp.denomination}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-500 text-sm">
          No stamps matched the selected criteria.
        </div>
      )}
    </div>
  );
}