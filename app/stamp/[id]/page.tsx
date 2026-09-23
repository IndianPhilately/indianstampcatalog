import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "@/app/components/copy-link-button";
import StampImageGallery from "@/app/components/stamp-image-gallery";
import DecadeYearWidget from "@/app/components/decade-year-widget";
import { formatDate, getStampDetails } from "@/lib/catalog";

export default async function StampPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { 
    error, 
    stamp, 
    previousStamps, 
    nextStamps, 
    relatedStamps, 
    years, 
    issuesCountMap = {} 
  } = await getStampDetails(id);

  if (error) {
    throw new Error(error);
  }

  if (!stamp) {
    notFound();
  }

  const issueYear = new Date(stamp.issue_date).getFullYear();
  const brochureImages = [stamp.brochure_image1_url, stamp.brochure_image2_url]
    .filter((url): url is string => Boolean(url))
    .map((src) => ({ src, alt: `Brochure for ${stamp.name}` }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Primary Article Content (col-span-8) */}
        <section className="lg:col-span-8">
          <article className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5">
            
            {/* Back Link & Top Pagination Bar */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <Link 
                href={`/year/${issueYear}`} 
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 transition"
              >
                &larr; Back to {issueYear} stamps
              </Link>
              
              <div className="inline-flex items-center gap-1.5">
                {previousStamps[0] ? (
                  <Link 
                    href={`/stamp/${previousStamps[0].id}`}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200/80 transition"
                  >
                    &larr; Previous
                  </Link>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg border border-slate-200/50 cursor-not-allowed">
                    &larr; Previous
                  </span>
                )}

                {nextStamps[0] ? (
                  <Link 
                    href={`/stamp/${nextStamps[0].id}`}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200/80 transition"
                  >
                    Next &rarr;
                  </Link>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg border border-slate-200/50 cursor-not-allowed">
                    Next &rarr;
                  </span>
                )}
              </div>
            </div>

            {/* Title & Clean Meta Information */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                {stamp.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                <span className="text-slate-500">Release Date:</span>{" "}
                <strong className="text-slate-900 font-semibold">{formatDate(stamp.issue_date)}</strong>
                {stamp.denomination && (
                  <>
                    <span className="mx-2 text-slate-300">&bull;</span>
                    <span className="text-slate-500">Denomination:</span>{" "}
                    <strong className="text-blue-700 font-semibold">{stamp.denomination}</strong>
                  </>
                )}
              </p>
            </div>

            {/* Stamp Image Mount with Skeleton Shimmer & Lightbox */}
            <StampImageGallery
              primaryImage={stamp.image_url ? { src: stamp.image_url, alt: stamp.name } : null}
              firstDayCover={
                stamp.first_day_cover_url
                  ? { src: stamp.first_day_cover_url, alt: `First Day Cover for ${stamp.name}` }
                  : null
              }
              brochures={brochureImages}
            />

            {/* Narrative Description */}
            <div className="pt-2 space-y-3 text-sm text-slate-800 leading-relaxed">
              <h2 className="text-base font-bold text-slate-950">About this stamp</h2>
              <div className="space-y-3 text-slate-700 whitespace-pre-line">
                {stamp.description ?? "No description available."}
              </div>
            </div>

            {/* Micro Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Share:</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(stamp.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 hover:text-slate-950 transition"
                  title="Share on Twitter"
                  aria-label="Share on Twitter"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`/stamp/${stamp.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 hover:text-blue-600 transition"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${stamp.name} - /stamp/${stamp.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 hover:text-emerald-600 transition"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </a>

                <CopyLinkButton stampName={stamp.name} />
              </div>
            </div>

          </article>
        </section>

        {/* Right Sidebar Rail (col-span-4) */}
        <aside className="lg:col-span-4 space-y-6" aria-label="Stamp navigation rail">
          
          {/* 1. Decade Year Widget */}
          <DecadeYearWidget 
            allYears={years} 
            issuesMap={issuesCountMap} 
            activeYear={issueYear} 
          />

          {/* 2. Related Stamps Card */}
          {relatedStamps.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
              <div className="pb-3.5 border-b border-slate-100 mb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">Related Stamps</h3>
                <p className="text-xs text-slate-500 mt-0.5">Thematically linked issues</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {relatedStamps.slice(0, 3).map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/stamp/${item.id}`}
                    className="group flex flex-col bg-white rounded-xl border border-slate-200/90 p-2 hover:border-blue-400 hover:shadow-xs transition duration-150"
                  >
                    <div className="w-full aspect-square bg-[#F1F4F7] rounded-lg p-1.5 flex items-center justify-center overflow-hidden border border-slate-100">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200/60 rounded" />
                      )}
                    </div>
                    
                    <div className="pt-1.5 text-center flex-1 flex flex-col justify-between">
                      <div>
                        <time className="block text-[10px] text-slate-400 leading-tight">
                          {formatDate(item.issue_date)}
                        </time>
                        <strong className="block text-xs font-semibold text-slate-800 group-hover:text-blue-700 leading-snug line-clamp-1 mt-0.5" title={item.name}>
                          {item.name}
                        </strong>
                      </div>
                      {item.denomination && (
                        <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                          {item.denomination}
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