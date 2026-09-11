import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getStampDetails } from "../../../lib/catalog";

export default async function StampPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, stamp, previousStamps, nextStamps, relatedStamps } = await getStampDetails(id);

  if (error) {
    throw new Error(error);
  }

  if (!stamp) {
    notFound();
  }

  const issueYear = new Date(stamp.issue_date).getFullYear();

  return (
    <div className="stamp-detail-layout">
      <div className="stamp-detail-content main-container">
        <div className="stamp-detail-header">
          <Link href={`/year/${issueYear}`} className="stamp-detail-back">
            Back to {issueYear} stamps
          </Link>
          <h2 className="home-title">{stamp.name}</h2>
        </div>
        <p className="stamp-meta">
          <strong>Release Date:</strong> {formatDate(stamp.issue_date)},
          <strong> Denomination:</strong> {stamp.denomination ?? "N/A"}
        </p>

        <hr className="thin-separator" />

        {stamp.image_url ? (
          <div className="stamp-image-frame">
            <img src={stamp.image_url} alt={stamp.name} className="stamp-image-large" />
          </div>
        ) : null}

        <h3 className="detail-section-title">About this stamp</h3>
        <div className="stamp-description" dangerouslySetInnerHTML={{ __html: stamp.description ?? "<p>No description available.</p>" }} />

        {stamp.first_day_cover_url ? (
          <div className="extra-section">
            <h3>First Day Cover</h3>
            <div className="extra-gallery">
              <a href={stamp.first_day_cover_url} target="_blank" rel="noreferrer">
                <img src={stamp.first_day_cover_url} alt={`First Day Cover for ${stamp.name}`} className="extra-image" />
              </a>
            </div>
          </div>
        ) : null}

        {(stamp.brochure_image1_url || stamp.brochure_image2_url) ? (
          <div className="extra-section">
            <h3>Brochure</h3>
            <div className="extra-gallery">
              {stamp.brochure_image1_url ? (
                <a href={stamp.brochure_image1_url} target="_blank" rel="noreferrer">
                  <img src={stamp.brochure_image1_url} alt={`Brochure for ${stamp.name}`} className="extra-image" />
                </a>
              ) : null}
              {stamp.brochure_image2_url ? (
                <a href={stamp.brochure_image2_url} target="_blank" rel="noreferrer">
                  <img src={stamp.brochure_image2_url} alt={`Brochure for ${stamp.name}`} className="extra-image" />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <hr className="thin-separator" />

        <div className="share-section">
          <span className="share-label">Share this:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(stamp.name)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
          >
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : `/stamp/${stamp.id}`)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
          >
            Facebook
          </a>
        </div>
      </div>

      <aside className="sidebar-box">
        <div className="sidebar-section">
          <div className="sidebar-header">Previous Issues</div>
          <div className="issue-list">
            {previousStamps.length ? (
              previousStamps.map((item) => (
                <div key={item.id} className="issue-item">
                  <div className="issue-date">{formatDate(item.issue_date)}</div>
                  <Link href={`/stamp/${item.id}`} className="issue-link">
                    {item.name}
                  </Link>
                </div>
              ))
            ) : (
              <div className="issue-item">No previous issues found.</div>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-header">Next Issues</div>
          <div className="issue-list">
            {nextStamps.length ? (
              nextStamps.map((item) => (
                <div key={item.id} className="issue-item">
                  <div className="issue-date">{formatDate(item.issue_date)}</div>
                  <Link href={`/stamp/${item.id}`} className="issue-link">
                    {item.name}
                  </Link>
                </div>
              ))
            ) : (
              <div className="issue-item">No next issues found.</div>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-header">Related Stamps</div>
          <div className="issue-list">
            {relatedStamps.length ? (
              relatedStamps.map((item) => (
                <div key={item.id} className="issue-item">
                  <div className="issue-date">{formatDate(item.issue_date)}</div>
                  <Link href={`/stamp/${item.id}`} className="issue-link">
                    {item.name}
                  </Link>
                </div>
              ))
            ) : (
              <div className="issue-item">No related stamps found.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
