import Link from "next/link";
import { notFound } from "next/navigation";
import YearStampGrid from "@/app/components/year-stamp-grid";
import DecadeYearWidget from "@/app/components/decade-year-widget";
import { getYearPageData } from "@/lib/catalog";

// Cache year catalog on Vercel Edge CDN for 24 hours (86400s)
// Drops server response time to near-zero for historical year views
export const revalidate = 86400;

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const { error, stamps, years, issuesCountMap = {} } = await getYearPageData(year);

  if (error) {
    throw new Error(error);
  }

  if (!stamps || !stamps.length) {
    notFound();
  }

  const currentYear = Number(year);
  const currentYearIndex = years.indexOf(currentYear);
  
  // Since years are sorted descending (e.g. 2013, 1948, 1947):
  // older year is at currentYearIndex + 1, newer year is at currentYearIndex - 1
  const olderYear = currentYearIndex !== -1 && currentYearIndex + 1 < years.length ? years[currentYearIndex + 1] : null;
  const newerYear = currentYearIndex > 0 ? years[currentYearIndex - 1] : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Primary Left Stamp Content (col-span-8) */}
        <section className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5">
          
          {/* Header & Year Pagination Buttons */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              {year} Commemorative Stamps
            </h1>

            <div className="flex items-center gap-1.5 shrink-0">
              {olderYear ? (
                <Link 
                  href={`/year/${olderYear}`}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200/80 transition"
                >
                  &larr; {olderYear}
                </Link>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg border border-slate-200/50 cursor-not-allowed">
                  &larr; Older
                </span>
              )}

              {newerYear ? (
                <Link 
                  href={`/year/${newerYear}`}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200/80 transition"
                >
                  {newerYear} &rarr;
                </Link>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg border border-slate-200/50 cursor-not-allowed">
                  Newer &rarr;
                </span>
              )}
            </div>
          </div>

          {/* Stamp Filter Toolbar & Grid */}
          <YearStampGrid stamps={stamps} />

        </section>

        {/* Sidebar Rail (col-span-4) */}
        <aside className="lg:col-span-4 space-y-6" aria-label="Year navigation rail">
          <DecadeYearWidget 
            allYears={years} 
            issuesMap={issuesCountMap} 
            activeYear={currentYear} 
          />
        </aside>

      </div>
    </main>
  );
}