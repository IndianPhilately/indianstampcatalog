import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getYearPageData } from "../../../lib/catalog";

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const { error, stamps, years } = await getYearPageData(year);

  if (error) {
    throw new Error(error);
  }

  if (!stamps.length) {
    notFound();
  }

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
        </div>
        <hr className="thin-separator" />

        <div className="stamp-grid">
          {stamps.map((stamp) => (
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
