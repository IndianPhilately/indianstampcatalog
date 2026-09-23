import Link from "next/link";
import { getThemesPageData } from "@/lib/catalog";
import ThemesExplorerClient from "@/app/components/themes-explorer-client";

export const dynamic = "force-dynamic";

export default async function ThemesPage() {
  const { 
    error, 
    themes, 
    totalThemesCount, 
    totalCatalogedStamps, 
    earliestYear 
  } = await getThemesPageData();

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-semibold text-rose-600">
        Error loading themes: {error}
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1 space-y-4">
      {/* Streamlined Header Card */}
      <section 
        aria-label="Philatelic Themes Overview" 
        className="bg-white rounded-2xl border border-slate-200/90 px-5 py-4 sm:px-6 sm:py-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Philatelic Themes
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5 max-w-2xl">
            Explore India&apos;s commemorative stamps classified by narrative, heritage, and cultural subject matter.
          </p>
        </div>

        {/* Compact Metadata Stat Indicators */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div>
            <strong className="text-slate-950 font-bold">{totalThemesCount}</strong> Themes
          </div>
          <span className="text-slate-300 select-none">&bull;</span>
          <div>
            <strong className="text-slate-950 font-bold">{totalCatalogedStamps}+</strong> Issues
          </div>
          <span className="text-slate-300 select-none">&bull;</span>
          <div>
            <strong className="text-slate-950 font-bold">{earliestYear}</strong>–Present
          </div>
        </div>
      </section>

      {/* 4-Column Explorer */}
      <ThemesExplorerClient initialThemes={themes} />
    </main>
  );
}