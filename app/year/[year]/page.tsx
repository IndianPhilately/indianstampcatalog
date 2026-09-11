import Link from "next/link";
import { notFound } from "next/navigation";
import YearStampGrid from "../../components/year-stamp-grid";
import { getYearPageData } from "../../../lib/catalog";

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const { error, stamps, years } = await getYearPageData(year);

  if (error) {
    throw new Error(error);
  }

  if (!stamps.length) {
    notFound();
  }

  const currentYear = Number(year);
  const currentYearIndex = years.indexOf(currentYear);
  const previousYear = years[currentYearIndex + 1];
  const nextYear = years[currentYearIndex - 1];

  return (
    <div className="page-wrapper">
      <div className="main-container">
        <div className="year-page-heading">
          <div>
            <h2 className="home-title">{year} Commemorative Stamps</h2>
            <p className="year-result-count">
              {stamps.length} {stamps.length === 1 ? "stamp" : "stamps"}
            </p>
          </div>
          <nav className="year-navigation" aria-label="Year navigation">
            {previousYear ? (
              <Link href={`/year/${previousYear}`}>&larr; {previousYear}</Link>
            ) : (
              <span aria-disabled="true">&larr; Older</span>
            )}
            {nextYear ? (
              <Link href={`/year/${nextYear}`}>{nextYear} &rarr;</Link>
            ) : (
              <span aria-disabled="true">Newer &rarr;</span>
            )}
          </nav>
        </div>
        <hr className="thin-separator" />

        <YearStampGrid stamps={stamps} />
      </div>

      <aside className="year-widget">
        <div className="year-header">Display Year</div>
        <div className="year-list">
          {years.map((item) => (
            <Link
              key={item}
              href={`/year/${item}`}
              className={item === Number(year) ? "active-year" : undefined}
              aria-current={item === Number(year) ? "page" : undefined}
            >
              {item}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
