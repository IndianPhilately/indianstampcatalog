"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DecadeYearWidgetProps = {
  allYears: number[];
  issuesMap: Record<number, number>;
  activeYear?: number;
};

export default function DecadeYearWidget({
  allYears,
  issuesMap = {},
  activeYear,
}: DecadeYearWidgetProps) {
  const router = useRouter();
  const [targetYearInput, setTargetYearInput] = useState("");

  const currentCalendarYear = new Date().getFullYear();
  const minCatalogYear = 1947;
  const maxCatalogYear = useMemo(
    () => (allYears.length ? Math.max(...allYears) : currentCalendarYear),
    [allYears, currentCalendarYear]
  );

  const minDecade = 1940;
  const maxDecade = Math.floor(currentCalendarYear / 10) * 10;

  // Defaults to the 1940s unless an activeYear is specified
  const [decadeStart, setDecadeStart] = useState(() => {
    if (activeYear && activeYear >= minCatalogYear) {
      return Math.floor(activeYear / 10) * 10;
    }
    return minDecade;
  });

  // Generates years in increasing order (e.g., 1940 to 1949)
  const decadeYears = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => decadeStart + i);
  }, [decadeStart]);

  const canGoPrev = decadeStart > minDecade;
  const canGoNext = decadeStart < maxDecade;

  const handlePrevDecade = () => {
    if (canGoPrev) setDecadeStart((prev) => prev - 10);
  };

  const handleNextDecade = () => {
    if (canGoNext) setDecadeStart((prev) => prev + 10);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = Number(targetYearInput.trim());
    if (yr && Number.isFinite(yr) && yr >= minCatalogYear && yr <= currentCalendarYear) {
      router.push(`/year/${yr}`);
      setTargetYearInput("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Widget Header & Year Jump */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-950 leading-snug tracking-tight">
            Display Year
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Browse chronologically
          </p>
        </div>

        <form onSubmit={handleJumpSubmit} className="relative w-32 sm:w-40">
          <label htmlFor="jumpYearInput" className="sr-only">
            Go to year
          </label>
          <input
            id="jumpYearInput"
            type="number"
            value={targetYearInput}
            onChange={(e) => setTargetYearInput(e.target.value)}
            placeholder="Go to year..."
            min={minCatalogYear}
            max={currentCalendarYear}
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
            aria-label="Submit year jump"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Decade Navigation Row */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm sm:text-base font-bold text-[#111e38] tracking-tight">
          Decade {decadeStart}s
        </span>

        <div className="inline-flex items-center bg-[#f0f4f9] border border-[#dbe3ed] rounded-lg px-2 py-1 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevDecade}
            disabled={!canGoPrev}
            className={`p-1 rounded transition duration-150 flex items-center justify-center ${
              canGoPrev
                ? "text-[#2b3a55] hover:text-slate-950 hover:bg-[#e2e8f0] cursor-pointer"
                : "text-slate-300 cursor-not-allowed"
            }`}
            aria-label="Previous decade"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <span className="text-xs sm:text-sm font-semibold text-[#1a2a44] px-2.5 tracking-tight select-none">
            {decadeStart}&ndash;{String((decadeStart + 9) % 100).padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={handleNextDecade}
            disabled={!canGoNext}
            className={`p-1 rounded transition duration-150 flex items-center justify-center ${
              canGoNext
                ? "text-[#2b3a55] hover:text-slate-950 hover:bg-[#e2e8f0] cursor-pointer"
                : "text-slate-300 cursor-not-allowed"
            }`}
            aria-label="Next decade"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* 5x2 Year Tiles Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {decadeYears.map((yr) => {
          const count = issuesMap[yr] ?? 0;
          const isActive = yr === activeYear;
          const isEligibleYear = yr >= minCatalogYear && yr <= currentCalendarYear;
          const hasIssues = count > 0 && isEligibleYear;

          // Selected Active Tile
          if (isActive && isEligibleYear) {
            return (
              <div
                key={yr}
                className="w-full h-[55px] max-w-[62px] mx-auto rounded-xl border-2 border-blue-600 bg-blue-50/70 p-1 flex flex-col items-center justify-center text-center shadow-xs"
              >
                <span className="text-xs sm:text-sm font-bold text-blue-900 leading-tight">
                  {yr}
                </span>
                <span className="text-[9px] sm:text-[10px] text-blue-700 font-semibold mt-0.5 leading-none">
                  {count} {count === 1 ? "issue" : "issues"}
                </span>
              </div>
            );
          }

          // Active Year with Issues
          if (hasIssues) {
            return (
              <Link
                key={yr}
                href={`/year/${yr}`}
                className="w-full h-[55px] max-w-[62px] mx-auto rounded-xl border border-slate-200 bg-white p-1 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-300 transition duration-150 group"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                  {yr}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 leading-none">
                  {count} {count === 1 ? "issue" : "issues"}
                </span>
              </Link>
            );
          }

          // Zero Issues or Inactive/Pre-1947 Tile
          return (
            <div
              key={yr}
              className="w-full h-[55px] max-w-[62px] mx-auto rounded-xl border border-slate-100 bg-slate-50/40 p-1 flex flex-col items-center justify-center text-center cursor-default opacity-60"
              aria-disabled="true"
            >
              <span className="text-xs sm:text-sm font-semibold text-slate-300 leading-tight">
                {yr}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-300/90 font-normal mt-0.5 leading-none">
                {yr < minCatalogYear ? "—" : "0 issues"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Jumps Footer */}
      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Quick jumps:</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={`/year/${minCatalogYear}`}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg font-medium transition text-[11px] sm:text-xs"
          >
            {minCatalogYear}
          </Link>
          <Link
            href={`/year/${maxCatalogYear}`}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg font-medium transition text-[11px] sm:text-xs"
          >
            {maxCatalogYear}
          </Link>
        </div>
      </div>
    </div>
  );
}