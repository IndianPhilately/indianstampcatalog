"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, type StampSummary } from "@/lib/catalog";

type RandomStampSliderProps = {
  stamps: StampSummary[];
};

export default function RandomStampSlider({ stamps }: RandomStampSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (stamps.length < 2) return;

    setActiveIndex(Math.floor(Math.random() * stamps.length));

    const intervalId = window.setInterval(() => {
      setActiveIndex((curr) => (curr + 1) % stamps.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [stamps.length]);

  if (stamps.length === 0) return null;

  const stamp = stamps[activeIndex];

  return (
    <aside
      className="mt-8 rounded-2xl overflow-hidden border border-blue-200 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-sm p-5 sm:p-6"
      aria-label="Featured stamp spotlight"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-5">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white/10 rounded-xl p-2 flex items-center justify-center shrink-0 border border-white/20">
            {stamp.image_url ? (
              <img
                src={stamp.image_url}
                alt={stamp.name}
                className="max-h-full max-w-full object-contain drop-shadow-md"
              />
            ) : null}
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
              Featured Stamp
            </span>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-1">
              {stamp.name}
            </h3>
            <p className="text-xs sm:text-sm text-blue-100">
              {formatDate(stamp.issue_date)}
              {stamp.denomination ? ` • ${stamp.denomination}` : ""}
            </p>
          </div>
        </div>

        <Link
          href={`/stamp/${stamp.id}`}
          className="px-4 py-2 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl transition shadow-xs shrink-0 self-end sm:self-center"
        >
          View full post &rarr;
        </Link>
      </div>
    </aside>
  );
}