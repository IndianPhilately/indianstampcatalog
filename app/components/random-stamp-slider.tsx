"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, type StampSummary } from "../../lib/catalog";

type RandomStampSliderProps = {
  stamps: StampSummary[];
};

export default function RandomStampSlider({ stamps }: RandomStampSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (stamps.length < 2) {
      return;
    }

    setActiveIndex(Math.floor(Math.random() * stamps.length));

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % stamps.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [stamps.length]);

  if (stamps.length === 0) {
    return null;
  }

  const stamp = stamps[activeIndex] ?? stamps[0];

  return (
    <div className="bottom-slider">
      <div className="slider-wrapper">
        <div className="slide" aria-live="polite">
          <div className="slide-left">
            {stamp.image_url ? (
              <img src={stamp.image_url} alt={stamp.name} className="slide-stamp" />
            ) : null}
          </div>

          <div className="slide-right">
            <div className="slide-info">
              <span className="slide-title">{stamp.name}</span>
              <p>
                {formatDate(stamp.issue_date)}
                {stamp.denomination ? ` | ${stamp.denomination}` : ""}
              </p>
            </div>
            <div className="slide-footer">
              <Link href={`/stamp/${stamp.id}`} className="slide-btn">
                View full post
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
