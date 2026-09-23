import Link from "next/link";
import { formatDate, getHomePageData } from "../lib/catalog";
import DecadeYearWidget from "./components/decade-year-widget";

// Cache on Vercel Edge CDN and revalidate at most once every hour (3600s)
export const revalidate = 3600;

export default async function Home() {
  const {
    error,
    stampCount = 0,
    years = [],
    issuesCountMap = {},
    latestStamp,
    recentStamps = [],
  } = await getHomePageData();

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-semibold text-rose-600">
        Error loading catalog: {error}
      </div>
    );
  }

  // Derive latest year strictly from database data
  const latestYear = latestStamp 
    ? new Date(latestStamp.issue_date).getFullYear() 
    : years.length > 0 
      ? years[0] 
      : null;

  // Split narrative text by line breaks and isolate the first two non-empty paragraphs
  const previewParagraphs = latestStamp?.description
    ? latestStamp.description
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Primary Column */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* 1. Welcome Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mb-2 tracking-tight">Home</h2>
            <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
              This site is for philatelists worldwide who collect Indian postal stamps. It serves as an online resource and reference for India&apos;s postage issues from independence to the latest releases. Each stamp tells a story of the nation&apos;s heritage, milestones, and remarkable personalities.
            </p>
          </div>

          {/* 2. Latest Addition Card */}
          {latestStamp ? (
            <article className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-slate-950">
                  <Link href={`/stamp/${latestStamp.id}`} className="hover:text-blue-700 transition">
                    {latestStamp.name}
                  </Link>
                </h3>
                <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-blue-700">
                  Latest Addition
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 items-start">
                {/* Left side: Stamp Mount + Meta Specs */}
                <div className="sm:col-span-1 space-y-3">
                  <div className="flex flex-col items-center justify-center bg-[#F1F4F7] p-3 rounded-xl border border-slate-200/70 min-h-[190px]">
                    {latestStamp.image_url ? (
                      <img 
                        src={latestStamp.image_url} 
                        alt={latestStamp.name} 
                        className="w-full max-w-[200px] sm:max-w-[220px] rounded-sm drop-shadow-sm object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No image available</span>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Issue Date:</span>
                      <span className="font-semibold text-slate-900">{formatDate(latestStamp.issue_date)}</span>
                    </div>
                    {latestStamp.denomination && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Denomination:</span>
                        <span className="font-semibold text-slate-900">{latestStamp.denomination}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Truncated to exactly 2 paragraphs */}
                <div className="sm:col-span-2 text-sm text-slate-800 leading-relaxed font-normal flex flex-col justify-between h-full">
                  <div className="space-y-3 text-slate-700">
                    {previewParagraphs.length > 0 ? (
                      previewParagraphs.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))
                    ) : (
                      <p>View the full stamp details for release information and more.</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link 
                      href={`/stamp/${latestStamp.id}`} 
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                    >
                      <span>Read full entry &amp; philatelic details</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ) : null}

        </section>

        {/* Right Sidebar Rail */}
        <aside className="lg:col-span-4 space-y-6" aria-label="Catalog highlights">
          
          {/* 1. Catalog Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
            <div className="pb-3.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">Catalog Summary</h3>
              <p className="text-xs text-slate-500 mt-0.5">Overview of archive collection</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3">
                <strong className="text-lg sm:text-xl font-bold text-slate-950 block">{stampCount}</strong>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {stampCount === 1 ? "Stamp" : "Stamps"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3">
                <strong className="text-lg sm:text-xl font-bold text-slate-950 block">{years.length}</strong>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {years.length === 1 ? "Year" : "Years"}
                </span>
              </div>
              {latestYear ? (
                <Link href={`/year/${latestYear}`} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 block hover:bg-slate-100 transition">
                  <strong className="text-lg sm:text-xl font-bold text-blue-700 block">{latestYear}</strong>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Latest &rarr;</span>
                </Link>
              ) : null}
            </div>
          </div>

          {/* 2. Display Year Widget */}
          <DecadeYearWidget allYears={years} issuesMap={issuesCountMap} />

          {/* 3. Recently Added Stamps */}
          {recentStamps.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3.5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">Recently Added</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Latest cataloged issues</p>
                </div>
                {latestYear && (
                  <Link href={`/year/${latestYear}`} className="text-xs font-bold text-blue-700 hover:text-blue-900 transition">
                    View all &rarr;
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {recentStamps.map((stamp) => (
                  <Link 
                    key={stamp.id} 
                    href={`/stamp/${stamp.id}`}
                    className="group flex flex-col bg-white rounded-xl border border-slate-200/90 p-2 hover:border-blue-400 hover:shadow-xs transition duration-150"
                  >
                    <div className="w-full aspect-square bg-[#F1F4F7] rounded-lg p-1.5 flex items-center justify-center overflow-hidden border border-slate-100">
                      {stamp.image_url ? (
                        <img 
                          src={stamp.image_url} 
                          alt={stamp.name} 
                          className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200/60 rounded" />
                      )}
                    </div>
                    <div className="pt-1.5 text-center flex-1 flex flex-col justify-between">
                      <div>
                        <time className="block text-[10px] text-slate-400 leading-tight">
                          {formatDate(stamp.issue_date)}
                        </time>
                        <strong className="block text-xs font-semibold text-slate-800 group-hover:text-blue-700 leading-snug line-clamp-1 mt-0.5" title={stamp.name}>
                          {stamp.name}
                        </strong>
                      </div>
                      {stamp.denomination && (
                        <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                          {stamp.denomination}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>
    </main>
  );
}