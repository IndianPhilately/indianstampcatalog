import Link from "next/link";
import { searchStamps } from "../../lib/catalog";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = await searchStamps(q ?? null);

  return (
    <div className="main-container">
      <h2 className="home-title">Search Results for "{q ?? ""}"</h2>

      {results.length ? (
        <div className="stamp-grid">
          {results.map((stamp) => (
            <div key={stamp.id} className="stamp-item">
              {stamp.image_url ? (
                <Link href={`/stamp/${stamp.id}`} className="stamp-link">
                  <img src={stamp.image_url} alt={stamp.name} />
                </Link>
              ) : null}
              <Link href={`/stamp/${stamp.id}`} className="stamp-link">
                <p className="stamp-titleyear">{stamp.name}</p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p>No stamps found matching your search.</p>
      )}
    </div>
  );
}
