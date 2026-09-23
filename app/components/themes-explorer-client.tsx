"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CuratedTheme } from "@/lib/catalog";

type ThemesExplorerClientProps = {
  initialThemes: CuratedTheme[];
};

const THEME_THUMBNAIL_OVERRIDES: Record<string, string> = {
  "leaders-personalities":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1948/stamps/1948-08-15-4.jpg",
  "historical-events-anniversaries":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1962/stamps/1962-11-14.jpg",
  "art-culture-mythology":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/2013/stamps/2013-11-13.jpg",
  "sports-international-relations":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1965/stamps/1965-06-26.jpg",
  "landmarks-architecture-heritage-sites":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1967/stamps/1967-03-19.jpg",
  "science-technology-space":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1969/stamps/1969-11-19.jpg",
  "national-symbols-identity":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1969/stamps/1969-10-02-4.jpg",
  "wildlife-nature":
    "https://dbrudrcwkaznsedphokb.supabase.co/storage/v1/object/public/stamps/1963/stamps/1963-10-07-3.jpg",
};

export default function ThemesExplorerClient({ initialThemes }: ThemesExplorerClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"count-desc" | "name-asc">("count-desc");

  const filteredAndSortedThemes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = initialThemes.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );

    if (sortOption === "name-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => b.count - a.count);
    }

    return result;
  }, [initialThemes, searchQuery, sortOption]);

  function getThumbnailImage(item: CuratedTheme): string {
    const titleLower = item.title.toLowerCase();

    if (
      item.id === "leaders-personalities" ||
      titleLower.includes("leaders") ||
      titleLower.includes("personalities")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["leaders-personalities"];
    }

    if (
      item.id === "historical-events-anniversaries" ||
      titleLower.includes("historical events")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["historical-events-anniversaries"];
    }

    if (
      item.id === "art-culture-mythology" ||
      titleLower.includes("art") ||
      titleLower.includes("culture") ||
      titleLower.includes("mythology")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["art-culture-mythology"];
    }

    if (
      item.id === "sports-international-relations" ||
      titleLower.includes("sports") ||
      titleLower.includes("international")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["sports-international-relations"];
    }

    if (
      item.id === "landmarks-architecture-heritage-sites" ||
      titleLower.includes("landmarks") ||
      titleLower.includes("architecture") ||
      titleLower.includes("heritage")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["landmarks-architecture-heritage-sites"];
    }

    if (
      item.id === "science-technology-space" ||
      titleLower.includes("science") ||
      titleLower.includes("technology") ||
      titleLower.includes("space")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["science-technology-space"];
    }

    if (
      item.id === "national-symbols-identity" ||
      titleLower.includes("national symbols") ||
      titleLower.includes("identity")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["national-symbols-identity"];
    }

    if (
      item.id === "wildlife-nature" ||
      titleLower.includes("wildlife") ||
      titleLower.includes("nature")
    ) {
      return THEME_THUMBNAIL_OVERRIDES["wildlife-nature"];
    }

    return item.featuredImage || "https://indianstampcatalog.vercel.app/favicon.ico";
  }

  return (
    <div className="space-y-4">
      {/* Compact Search & Sort Toolbar */}
      <section
        aria-label="Theme Filters"
        className="bg-white rounded-2xl border border-slate-200/90 px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3"
      >
        <div className="relative w-full sm:w-72">
          <label htmlFor="themeSearchInput" className="sr-only">
            Search themes
          </label>
          <input
            id="themeSearchInput"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search themes..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="themeSortSelect" className="text-slate-500 font-medium shrink-0">
            Sort by:
          </label>
          <select
            id="themeSortSelect"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as "count-desc" | "name-asc")}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition cursor-pointer"
          >
            <option value="count-desc">Most stamps</option>
            <option value="name-asc">Alphabetical (A–Z)</option>
          </select>
        </div>
      </section>

      {/* 2-Column Balanced Grid */}
      <section>
        {filteredAndSortedThemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAndSortedThemes.map((item) => {
              const firstWord = item.title.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
              const searchHref = `/search?q=${encodeURIComponent(firstWord)}&themeTitle=${encodeURIComponent(item.title)}`;
              const thumbnailImage = getThumbnailImage(item);

              return (
                <Link
                  key={item.id}
                  href={searchHref}
                  className="group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Block: Borderless Stamp + Title Header + Navigation Pill */}
                    <div className="flex items-start gap-4 mb-2.5">
                      <div className="w-[64px] h-[74px] min-w-[64px] flex items-center justify-center shrink-0">
                        <img
                          src={thumbnailImage}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.16)] group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-base font-bold text-slate-950 group-hover:text-blue-700 transition leading-snug tracking-tight">
                            {item.title}
                          </h2>

                          <span className="inline-flex items-center gap-1.5 bg-[#f0f4f9] group-hover:bg-[#e2e8f0] group-hover:border-blue-300 border border-[#dbe3ed] text-[#111e38] group-hover:text-blue-700 rounded-xl sm:rounded-2xl px-3 py-1 text-xs font-bold shrink-0 transition shadow-2xs">
                            <span>{item.count} issues</span>
                            <span className="text-sm font-semibold leading-none transition-transform group-hover:translate-x-0.5">
                              &rarr;
                            </span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-500 text-sm">
            No themes found matching &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </section>
    </div>
  );
}