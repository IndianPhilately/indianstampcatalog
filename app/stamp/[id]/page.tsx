import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "../../components/copy-link-button";
import { formatDate, getStampDetails } from "../../../lib/catalog";

export default async function StampPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, stamp, previousStamps, nextStamps, relatedStamps, years } = await getStampDetails(id);

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
            <svg className="share-icon share-icon-twitter" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.37l7.24-8.28L2.8 2h6.4l4.42 5.85L18.9 2Zm-1.1 17.85h1.73L8.3 4.03H6.44L17.8 19.85Z" />
            </svg>
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : `/stamp/${stamp.id}`)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
          >
            <svg className="share-icon share-icon-facebook" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M13.5 22v-8h2.75l.5-3h-3.25V9.05c0-.87.29-1.46 1.55-1.46h1.65V4.9c-.29-.04-1.28-.13-2.44-.13-2.42 0-4.08 1.48-4.08 4.2V11H7.5v3h2.68v8h3.32Z" />
            </svg>
            Facebook
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${stamp.name} - /stamp/${stamp.id}`)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
          >
            <svg className="share-icon share-icon-whatsapp" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M20.52 3.48A11.84 11.84 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.59 5.93L.12 24l6.36-1.67a11.84 11.84 0 0 0 5.6 1.42h.01c6.53 0 11.85-5.32 11.85-11.86 0-3.17-1.22-6.14-3.42-8.41Zm-8.44 18.2h-.01a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.84 9.84 0 0 1-1.51-5.17C2.19 6.43 6.62 2 12.08 2a9.8 9.8 0 0 1 6.98 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.46-4.43 9.89-9.87 9.89Zm5.42-7.41c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.69.15-.2.3-.79.98-.97 1.18-.18.2-.36.23-.66.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.36.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.69-1.65-.94-2.26-.25-.59-.5-.51-.69-.52h-.59c-.2 0-.53.08-.81.38-.28.3-1.06 1.04-1.06 2.54 0 1.5 1.09 2.94 1.24 3.14.15.2 2.14 3.27 5.19 4.59.73.32 1.3.51 1.75.65.74.24 1.41.2 1.94.12.59-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35Z" />
            </svg>
            WhatsApp
          </a>
          <CopyLinkButton stampName={stamp.name} />
        </div>
      </div>

      <aside className="sidebar-box">
        <div className="year-widget detail-year-widget">
          <div className="year-header">Display Year</div>
          <div className="year-list">
            {years.map((year) => (
              <Link
                key={year}
                href={`/year/${year}`}
                className={year === issueYear ? "active-year" : undefined}
                aria-current={year === issueYear ? "page" : undefined}
              >
                {year}
              </Link>
            ))}
          </div>
        </div>

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
