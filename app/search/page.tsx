import { searchStamps } from "@/lib/catalog";
import SearchResultsClient from "@/app/components/search-results-client";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    themeTitle?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q?.trim() || "";
  const themeTitle = resolvedParams.themeTitle?.trim() || "";

  // Directly pass query to searchStamps; returns matches or default catalog
  const stamps = await searchStamps(q);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
      <SearchResultsClient
        initialStamps={stamps || []}
        searchQuery={q}
        themeTitle={themeTitle}
      />
    </main>
  );
}