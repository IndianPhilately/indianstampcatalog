import MiniSearch from "minisearch";
import type { StampSearchResult } from "@/lib/catalog";

export const MAX_SEARCH_QUERY_LENGTH = 200;
export const SEARCH_CATALOGUE_CACHE_TTL_MS = 5 * 60 * 1000;

export type SearchCatalogueRecord = StampSearchResult & {
  description: string | null;
};

type SearchCataloguePayload = {
  version: number;
  total: number;
  records: SearchCatalogueRecord[];
};

export type SearchCatalogueIndex = {
  index: MiniSearch<SearchCatalogueRecord>;
  displayRecords: Map<string, StampSearchResult>;
};

const tokenize = (text: string) => text.match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
const processTerm = (term: string) => term.normalize("NFKC").toLowerCase();
const SEARCH_OPTIONS = {
  boost: { name: 4, theme: 2.5, description: 1 },
  combineWith: "AND" as const,
  prefix: (term: string) => term.length > 3,
  fuzzy: false as const,
  maxFuzzy: 2,
};
const FUZZY_SEARCH_OPTIONS = {
  ...SEARCH_OPTIONS,
  fuzzy: (term: string) => (term.length > 3 ? 0.2 : false),
};

let searchCataloguePromise: Promise<SearchCatalogueIndex> | null = null;
let searchCatalogueCache: SearchCatalogueIndex | null = null;
let searchCatalogueCachedAt = 0;

function getAdjacentTranspositions(term: string): string[] {
  if (term.length <= 3 || term.length > 7) return [];

  // MiniSearch uses Levenshtein distance, where an adjacent swap costs two edits.
  const variants = new Set<string>();
  for (let index = 0; index < term.length - 1; index += 1) {
    if (term[index] === term[index + 1]) continue;
    variants.add(
      `${term.slice(0, index)}${term[index + 1]}${term[index]}${term.slice(index + 2)}`,
    );
  }
  return Array.from(variants);
}

function isSearchCatalogueRecord(value: unknown): value is SearchCatalogueRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    (typeof record.theme === "string" || record.theme === null) &&
    (typeof record.description === "string" || record.description === null) &&
    (typeof record.issue_date === "string" || record.issue_date === null) &&
    (typeof record.denomination === "string" || record.denomination === null) &&
    (typeof record.image_url === "string" || record.image_url === null)
  );
}

function createSearchCatalogueIndex(value: unknown): SearchCatalogueIndex {
  if (!value || typeof value !== "object") {
    throw new Error("The search catalogue response was invalid.");
  }

  const payload = value as Partial<SearchCataloguePayload>;
  if (
    payload.version !== 1 ||
    !Number.isInteger(payload.total) ||
    !Array.isArray(payload.records) ||
    payload.records.length !== payload.total ||
    !payload.records.every(isSearchCatalogueRecord)
  ) {
    throw new Error("The search catalogue response was incomplete or invalid.");
  }

  const ids = new Set(payload.records.map((record) => record.id));
  if (ids.size !== payload.records.length) {
    throw new Error("The search catalogue contains duplicate stamp IDs.");
  }

  const records = payload.records;
  const displayRecords = new Map(
    records.map(({ id, name, theme, issue_date, denomination, image_url }) => [
      id,
      { id, name, theme, issue_date, denomination, image_url },
    ]),
  );
  const index = new MiniSearch<SearchCatalogueRecord>({
    idField: "id",
    fields: ["name", "theme", "description"],
    storeFields: ["id"],
    tokenize,
    processTerm,
    searchOptions: SEARCH_OPTIONS,
  });

  index.addAll(records);
  return { index, displayRecords };
}

export function loadSearchCatalogueIndex(): Promise<SearchCatalogueIndex> {
  if (
    searchCatalogueCache &&
    Date.now() - searchCatalogueCachedAt < SEARCH_CATALOGUE_CACHE_TTL_MS
  ) {
    return Promise.resolve(searchCatalogueCache);
  }
  if (searchCataloguePromise) return searchCataloguePromise;

  const request = fetch("/api/search-catalog")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Search catalogue request failed (${response.status}).`);
      }
      const catalogue = createSearchCatalogueIndex(await response.json());
      searchCatalogueCache = catalogue;
      searchCatalogueCachedAt = Date.now();
      return catalogue;
    });
  searchCataloguePromise = request;
  void request.then(
    () => {
      if (searchCataloguePromise === request) searchCataloguePromise = null;
    },
    () => {
      if (searchCataloguePromise === request) searchCataloguePromise = null;
    },
  );

  return searchCataloguePromise;
}

export function getCachedSearchCatalogueIndex(): SearchCatalogueIndex | null {
  return searchCatalogueCache &&
    Date.now() - searchCatalogueCachedAt < SEARCH_CATALOGUE_CACHE_TTL_MS
    ? searchCatalogueCache
    : null;
}

export function searchCatalogue(
  catalogue: SearchCatalogueIndex,
  query: string,
): StampSearchResult[] {
  const terms = Array.from(new Set(tokenize(query).map(processTerm)));
  if (!terms.length) return [];

  let combinedScores: Map<string, number> | null = null;
  for (const term of terms) {
    const termScores = new Map<string, number>();
    const matches = catalogue.index.search(term, SEARCH_OPTIONS);
    for (const result of matches) {
      const id = String(result.id);
      termScores.set(id, Math.max(termScores.get(id) ?? 0, result.score));
    }

    if (matches.length === 0) {
      const fuzzyMatches = catalogue.index.search(term, FUZZY_SEARCH_OPTIONS);
      for (const result of fuzzyMatches) {
        const id = String(result.id);
        termScores.set(id, Math.max(termScores.get(id) ?? 0, result.score));
      }

      for (const transposedTerm of getAdjacentTranspositions(term)) {
        const transposedMatches = catalogue.index.search(transposedTerm, {
          ...SEARCH_OPTIONS,
          prefix: false,
        });
        for (const result of transposedMatches) {
          const id = String(result.id);
          termScores.set(id, Math.max(termScores.get(id) ?? 0, result.score));
        }
      }
    }

    if (combinedScores === null) {
      combinedScores = termScores;
      continue;
    }

    for (const [id, score] of combinedScores) {
      const matchingScore = termScores.get(id);
      if (matchingScore === undefined) {
        combinedScores.delete(id);
      } else {
        combinedScores.set(id, score + matchingScore);
      }
    }
  }

  return Array.from(combinedScores ?? [])
    .sort(
      ([aId, aScore], [bId, bScore]) =>
        bScore - aScore ||
        (catalogue.displayRecords.get(bId)?.issue_date ?? "").localeCompare(
          catalogue.displayRecords.get(aId)?.issue_date ?? "",
        ) ||
        aId.localeCompare(bId),
    )
    .flatMap(([id]) => {
      const record = catalogue.displayRecords.get(id);
      return record ? [record] : [];
    });
}
