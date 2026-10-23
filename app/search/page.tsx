import { searchStamps, searchStampsByTheme } from "@/lib/catalog";
import SearchResultsClient from "@/app/components/search-results-client";

export const metadata = {
  title: "Search the Catalogue",
  robots: {
    index: false,
    follow: true,
  },
};

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

  const stamps = themeTitle
    ? await searchStampsByTheme(themeTitle)
    : await searchStamps(q);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
      <SearchResultsClient
        initialStamps={stamps}
        searchQuery={q}
        themeTitle={themeTitle}
      />
    </main>
  );
}