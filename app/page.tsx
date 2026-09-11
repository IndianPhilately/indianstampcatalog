import Link from "next/link";
import { formatDate, getHomePageData } from "../lib/catalog";
import RandomStampSlider from "./components/random-stamp-slider";

export default async function Home() {
  const {
    error,
    stampCount = 0,
    years = [],
    latestStamp,
    recentStamps = [],
    randomStamps = [],
  } = await getHomePageData();

  if (error) {
    return <div className="content-error">Error loading catalog: {error}</div>;
  }

  return (
    <div className="page-shell">
      <div className="page-wrapper home-page-wrapper">
        <div className="main-container">
          <h2 className="home-title">Home</h2>
          <p>
            This site is for Philatelists around the world who collect Indian Postal Stamps.
            DaakTicket India is an online resource and reference for Indian postage stamps
            since independence till the latest issues.
          </p>

          <hr className="thin-separator" />

          {latestStamp ? (
            <div>
              <h3 className="latest-title">
                Latest DTI addition:
                <Link href={`/stamp/${latestStamp.id}`}>{latestStamp.name}</Link>
              </h3>

              <div className="latest-stamp">
                {latestStamp.image_url ? (
                  <img
                    src={latestStamp.image_url}
                    alt={latestStamp.name}
                    className="stamp-image"
                  />
                ) : null}

                <div className="stamp-description">
                  <strong>{latestStamp.name}</strong> is a recent addition to the catalog.
                  {latestStamp.description ? (
                    <>
                      {latestStamp.description.slice(0, 960)}
                      {latestStamp.description.length > 960 ? "..." : ""}
                    </>
                  ) : (
                    <span> View the full stamp details for release information and more.</span>
                  )}
                  {latestStamp.description ? " " : null}
                  <Link href={`/stamp/${latestStamp.id}`}>[more]</Link>
                </div>
              </div>
            </div>
          ) : (
            <p>No stamps available yet.</p>
          )}

        </div>

        <aside className="home-sidebar" aria-label="Catalog navigation and highlights">
          <div className="year-widget">
            <div className="year-header">Display Year</div>
            <div className="year-list">
              {years.map((year) => (
                <Link key={year} href={`/year/${year}`}>
                  {year}
                </Link>
              ))}
            </div>
          </div>

          <div className="summary-widget">
            <div className="year-header">Catalog Summary</div>
            <div className="catalog-summary" aria-label="Catalog summary">
              <div>
                <strong>{stampCount}</strong>
                <span>{stampCount === 1 ? "stamp" : "stamps"}</span>
              </div>
              <div>
                <strong>{years.length}</strong>
                <span>{years.length === 1 ? "year covered" : "years covered"}</span>
              </div>
              {latestStamp ? (
                <div>
                  <strong>{new Date(latestStamp.issue_date).getFullYear()}</strong>
                  <span>latest issue year</span>
                </div>
              ) : null}
            </div>
          </div>

          {recentStamps.length ? (
            <div className="recent-widget">
              <div className="year-header">Recently Added</div>
              <div className="recent-list">
                {recentStamps.map((stamp) => (
                  <Link key={stamp.id} href={`/stamp/${stamp.id}`} className="recent-item">
                    {stamp.image_url ? (
                      <img src={stamp.image_url} alt={stamp.name} />
                    ) : (
                      <span className="recent-image-placeholder" aria-hidden="true" />
                    )}
                    <span>
                      <strong>{stamp.name}</strong>
                      <small>{formatDate(stamp.issue_date)}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <RandomStampSlider stamps={randomStamps} />
    </div>
  );
}
