"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDate, type StampYearItem } from "@/lib/catalog";

type YearStampGridProps = {
  stamps: StampYearItem[];
};

function getUniqueSortedKeys(
  items: StampYearItem[],
  key: "theme" | "denomination"
): string[] {
  const values = items
    .map((item) => item[key])
    .filter((v): v is string => Boolean(v));
  return Array.from(new Set(values)).sort();
}

export default function YearStampGrid({ stamps }: YearStampGridProps) {
  const [themeFilter, setThemeFilter] = useState("all");
  const [denominationFilter, setDenominationFilter] = useState("all");

  const themes = useMemo(() => getUniqueSortedKeys(stamps, "theme"), [stamps]);
  const denominations = useMemo(() => getUniqueSortedKeys(stamps, "denomination"), [stamps]);

  const filteredStamps = stamps.filter(
    (stamp) =>
      (themeFilter === "all" || stamp.theme === themeFilter) &&
      (denominationFilter === "all" || stamp.denomination === denominationFilter)
  );

  return (
    <>
      {/* Filter Toolbar */}
      <div
        className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs"
        aria-label="Filter stamps"
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="themeFilterSelect" className="text-slate-500 font-medium shrink-0">
              Theme:
            </label>
            <select
              id="themeFilterSelect"
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer min-w-[140px]"
            >
              <option value="all">All themes</option>
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="denomFilterSelect" className="text-slate-500 font-medium shrink-0">
              Denomination:
            </label>
            <select
              id="denomFilterSelect"
              value={denominationFilter}
              onChange={(e) => setDenominationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer min-w-[140px]"
            >
              <option value="all">All denominations</option>
              {denominations.map((denomination) => (
                <option key={denomination} value={denomination}>
                  {denomination}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-slate-500 text-xs font-medium">
          {filteredStamps.length} {filteredStamps.length === 1 ? "stamp" : "stamps"}
        </span>
      </div>

      {/* 3-Column Stamp Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
        {filteredStamps.map((stamp) => (
          <Link
            key={stamp.id}
            href={`/stamp/${stamp.id}`}
            className="group flex flex-col bg-white rounded-xl border border-slate-200/90 p-2.5 hover:border-blue-400 hover:shadow-md transition duration-150"
          >
            <div className="w-full h-[210px] min-h-[210px] rounded-lg bg-[#F1F4F7] flex items-center justify-center p-2 overflow-hidden border border-slate-100/70">
              {stamp.image_url ? (
                <img
                  src={stamp.image_url}
                  alt={stamp.name}
                  className="h-[185px] min-h-[185px] max-h-[185px] max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <span className="text-xs text-slate-400">Image unavailable</span>
              )}
            </div>

            <div className="pt-2 text-center flex-1 flex flex-col justify-between">
              <div>
                <time className="block text-xs text-slate-500 leading-tight">
                  {formatDate(stamp.issue_date)}
                </time>
                <h2
                  className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 leading-snug line-clamp-1 mt-0.5"
                  title={stamp.name}
                >
                  {stamp.name}
                </h2>
              </div>
              {stamp.denomination ? (
                <p className="text-xs text-slate-500 font-medium mt-1">{stamp.denomination}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      {!filteredStamps.length && (
        <p className="text-center py-10 text-slate-500 text-sm">No stamps match these filters.</p>
      )}
    </>
  );
}