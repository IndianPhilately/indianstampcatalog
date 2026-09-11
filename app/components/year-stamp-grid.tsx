"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDate, type StampYearItem } from "../../lib/catalog";

type YearStampGridProps = {
  stamps: StampYearItem[];
};

export default function YearStampGrid({ stamps }: YearStampGridProps) {
  const [themeFilter, setThemeFilter] = useState("all");
  const [denominationFilter, setDenominationFilter] = useState("all");

  const themes = useMemo(
    () =>
      Array.from(
        new Set(stamps.map((stamp) => stamp.theme).filter((value): value is string => Boolean(value)))
      ).sort(),
    [stamps]
  );
  const denominations = useMemo(
    () =>
      Array.from(
        new Set(
          stamps
            .map((stamp) => stamp.denomination)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [stamps]
  );
  const filteredStamps = stamps.filter(
    (stamp) =>
      (themeFilter === "all" || stamp.theme === themeFilter) &&
      (denominationFilter === "all" || stamp.denomination === denominationFilter)
  );

  return (
    <>
      <div className="year-filters" aria-label="Filter stamps">
        <label>
          Theme
          <select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value)}>
            <option value="all">All themes</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>
        <label>
          Denomination
          <select
            value={denominationFilter}
            onChange={(event) => setDenominationFilter(event.target.value)}
          >
            <option value="all">All denominations</option>
            {denominations.map((denomination) => (
              <option key={denomination} value={denomination}>
                {denomination}
              </option>
            ))}
          </select>
        </label>
        <span className="year-filter-count">
          {filteredStamps.length} {filteredStamps.length === 1 ? "stamp" : "stamps"}
        </span>
      </div>

      <div className="stamp-grid">
        {filteredStamps.map((stamp) => (
          <div key={stamp.id} className="stamp-item">
            <Link href={`/stamp/${stamp.id}`} className="stamp-link stamp-card-link">
              {stamp.image_url ? (
                <img src={stamp.image_url} alt={stamp.name} />
              ) : (
                <span className="stamp-image-placeholder" aria-hidden="true">
                  Image unavailable
                </span>
              )}
              <p className="stamp-date">{formatDate(stamp.issue_date)}</p>
              <p className="stamp-titleyear">{stamp.name}</p>
              {stamp.denomination ? (
                <p className="stamp-denomination">{stamp.denomination}</p>
              ) : null}
            </Link>
          </div>
        ))}
      </div>

      {!filteredStamps.length ? <p className="filter-empty">No stamps match these filters.</p> : null}
    </>
  );
}
