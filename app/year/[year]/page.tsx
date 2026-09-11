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
        <h2 className="home-title">{year} Commemorative Stamps</h2>
        <hr className="thin-separator" />

        <div className="stamp-grid">
          {stamps.map((stamp) => (
            <div key={stamp.id} className="stamp-item">
              {stamp.image_url ? (
                <Link href={`/stamp/${stamp.id}`} className="stamp-link">
                  <img src={stamp.image_url} alt={stamp.name} />
                </Link>
              ) : null}

              <Link href={`/stamp/${stamp.id}`} className="stamp-link">
                <p className="stamp-date">{formatDate(stamp.issue_date)}</p>
              </Link>

              <p className="stamp-titleyear">{stamp.name}</p>
            </div>
          ))}
        </div>
      </div>

      <aside className="year-widget">
        <div className="year-header">Display Year</div>
        <div className="year-list">
          {years.map((item) => (
            <Link key={item} href={`/year/${item}`}>
              {item}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
