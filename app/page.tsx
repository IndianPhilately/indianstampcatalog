import Link from "next/link";
import { formatDate, getHomePageData } from "../lib/catalog";

export default async function Home() {
  const { error, years = [], latestStamp, randomStamps = [] } = await getHomePageData();

  if (error) {
    return <div className="content-error">Error loading catalog: {error}</div>;
  }

  return (
    <div className="page-shell">
      <div className="page-wrapper">
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
                      {latestStamp.description.slice(0, 240)}
                      {latestStamp.description.length > 240 ? "..." : ""}
                    </>
                  ) : (
                    <span> View the full stamp details for release information and more.</span>
                  )}
                  <p>
                    <Link href={`/stamp/${latestStamp.id}`}>more...</Link>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p>No stamps available yet.</p>
          )}
        </div>

        <aside className="year-widget">
          <div className="year-header">Display Year</div>
          <div className="year-list">
            {years.map((year) => (
              <Link key={year} href={`/year/${year}`}>
                {year}
              </Link>
            ))}
          </div>
        </aside>
      </div>

      {randomStamps.length > 0 ? (
        <div className="bottom-slider">
          <div className="slider-wrapper">
            {randomStamps.map((stamp, index) => (
              <div key={stamp.id} className={`slide${index === 0 ? " active" : ""}`}>
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
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
