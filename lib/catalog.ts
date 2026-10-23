import { cache } from "react";
import { supabase } from "./supabaseClient";

export type StampSummary = {
  id: string;
  name: string;
  issue_date: string;
  denomination: string | null;
  image_url: string | null;
  description: string | null;
};

export type StampRecord = {
  id: string;
  name: string;
  issue_date: string;
  denomination: string | null;
  theme: string | null;
  description: string | null;
  image_url: string | null;
  first_day_cover_url: string | null;
  brochure_image1_url: string | null;
  brochure_image2_url: string | null;
  keywords: string[] | null;
};

export type StampListItem = Pick<
  StampRecord,
  "id" | "name" | "issue_date" | "denomination" | "theme" | "image_url"
>;

export type StampYearItem = StampListItem;
export type StampAdjacentItem = StampListItem;

export type StampSearchResult = Pick<
  StampRecord,
  "id" | "name" | "issue_date" | "denomination" | "theme" | "image_url"
>;

export type CuratedTheme = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  count: number;
  featuredImage?: string | null;
};

export const THEME_DEFINITIONS: Omit<CuratedTheme, "count" | "featuredImage">[] = [
  {
    id: "national-symbols",
    title: "National Symbols & Identity",
    subtitle: "Emblems, flags, constitution, and statehood insignia",
    description:
      "The Ashoka Lion Capital, the Tricolour, constitutional milestones, and symbols defining sovereign democratic India.",
  },
  {
    id: "leaders",
    title: "Leaders & Personalities",
    subtitle: "Memorial and statehood personalities",
    description:
      "Freedom fighters, constitutional architects, social reformers, Nobel laureates, and visionary heads of state.",
  },
  {
    id: "historical-events",
    title: "Historical Events & Anniversaries",
    subtitle: "Freedom struggle landmarks and centenaries",
    description:
      "Turning points of the freedom struggle, centenaries of national institutions, treaty signings, and jubilee milestones.",
  },
  {
    id: "wildlife-nature",
    title: "Wildlife & Nature",
    subtitle: "Endangered fauna, national parks, and botanical heritage",
    description:
      "Royal Bengal tigers, Asiatic lions, Himalayan wildflowers, migratory birds, and forest biodiversity preserves.",
  },
  {
    id: "art-culture",
    title: "Art, Culture & Mythology",
    subtitle: "Dance, epic folklore, and traditional handicrafts",
    description:
      "Classical dances (Kathakali, Bharatanatyam), miniature ragamala paintings, folk handicrafts, and ancient epics.",
  },
  {
    id: "science-tech",
    title: "Science, Technology & Space",
    subtitle: "Space exploration, research, atomic energy, and pioneers",
    description:
      "Satellite launch vehicles, nuclear research pioneers, technological self-reliance, and premier scientific institutes.",
  },
  {
    id: "sports-international",
    title: "Sports & International Relations",
    subtitle: "Asian Games, Olympics, global summits, and diplomacy",
    description:
      "Historic Asian and Commonwealth Games, Olympic representations, United Nations commemorations, and international treaties.",
  },
  {
    id: "landmarks-heritage",
    title: "Landmarks, Architecture & Heritage Sites",
    subtitle: "UNESCO monuments, forts, and historic temples",
    description:
      "UNESCO World Heritage monuments, hill forts of Rajasthan, Dravidian temple towers, and colonial landmarks.",
  },
];

export function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getYearsFromStamps(
  stamps: Array<{ issue_date: string | null }>
): number[] {
  return Array.from(
    new Set(
      stamps
        .filter(
          (stamp): stamp is { issue_date: string } => stamp.issue_date !== null,
        )
        .map((stamp) => new Date(stamp.issue_date).getFullYear())
        .filter((year) => Number.isFinite(year))
    )
  ).sort((a, b) => b - a);
}

export function getIssuesCountByYear(
  stamps: Array<{ issue_date: string | null }>
): Record<number, number> {
  const map: Record<number, number> = {};
  for (const stamp of stamps) {
    if (!stamp.issue_date) continue;
    const yr = new Date(stamp.issue_date).getFullYear();
    if (Number.isFinite(yr)) {
      map[yr] = (map[yr] || 0) + 1;
    }
  }
  return map;
}

export async function getAllStampDates() {
  const pageSize = 1000;
  const stamps: Array<{ id: string; issue_date: string | null }> = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("stamps")
      .select("id, issue_date")
      .order("issue_date", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return { data: [] as typeof stamps, error: error.message };
    }

    const page = data ?? [];
    stamps.push(...page);

    if (page.length < pageSize) {
      return { data: stamps, error: null };
    }
  }
}

export async function getHomePageData() {
  const [recentResult, allDatesResult, countResult] = await Promise.all([
    supabase
      .from("stamps")
      .select("id, name, issue_date, denomination, image_url, description")
      .order("issue_date", { ascending: false })
      .limit(4),
    getAllStampDates(),
    supabase.from("stamps").select("id", { count: "exact", head: true }),
  ]);

  const error =
    recentResult.error?.message ??
    allDatesResult.error ??
    countResult.error?.message;

  if (error) {
    return {
      error,
      stampCount: 0,
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
      latestStamp: null as StampSummary | null,
      recentStamps: [] as StampSummary[],
    };
  }

  const recentList = (recentResult.data ?? []) as StampSummary[];
  const allStampsWithDate = allDatesResult.data;

  return {
    error: null,
    stampCount: countResult.count ?? 0,
    years: getYearsFromStamps(allStampsWithDate),
    issuesCountMap: getIssuesCountByYear(allStampsWithDate),
    latestStamp: recentList[0] ?? null,
    recentStamps: recentList.slice(1, 4),
  };
}

export async function getSitemapStamps() {
  const { data, error } = await getAllStampDates();
  if (error) {
    throw new Error(`Unable to load sitemap stamps: ${error}`);
  }
  return data;
}

export async function getYearPageData(year: string) {
  const yearNumber = Number(year);

  if (!Number.isFinite(yearNumber)) {
    return {
      error: "Invalid year",
      stamps: [] as StampYearItem[],
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const [yearStampsResult, allDatesResult] = await Promise.all([
    supabase
      .from("stamps")
      .select("id, name, issue_date, denomination, theme, image_url")
      .gte("issue_date", `${yearNumber}-01-01`)
      .lt("issue_date", `${yearNumber + 1}-01-01`)
      .order("issue_date", { ascending: true }),
    getAllStampDates(),
  ]);

  const error = yearStampsResult.error?.message ?? allDatesResult.error;

  if (error) {
    return {
      error,
      stamps: (yearStampsResult.data ?? []) as StampYearItem[],
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const allStampsWithDate = allDatesResult.data;

  return {
    error: null,
    stamps: (yearStampsResult.data ?? []) as StampYearItem[],
    years: getYearsFromStamps(allStampsWithDate),
    issuesCountMap: getIssuesCountByYear(allStampsWithDate),
  };
}

function getSignificantTitleKeywords(title: string): string[] {
  const stopWords = new Set([
    "india",
    "stamp",
    "stamps",
    "postage",
    "first",
    "day",
    "cover",
    "the",
    "and",
    "of",
    "in",
    "to",
    "a",
    "an",
    "on",
    "for",
    "with",
    "centenary",
    "series",
  ]);

  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
}

export async function getRelatedStamps(
  currentStamp: StampRecord,
  limit: number = 6
): Promise<StampAdjacentItem[]> {
  const currentYear = new Date(currentStamp.issue_date).getFullYear();
  const titleKeywords = getSignificantTitleKeywords(currentStamp.name);

  let query = supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, theme, image_url")
    .neq("id", currentStamp.id);

  const filterConditions: string[] = [];

  for (const kw of titleKeywords.slice(0, 3)) {
    filterConditions.push(`name.ilike.%${kw}%`);
  }

  if (currentStamp.theme) {
    filterConditions.push(`theme.eq."${currentStamp.theme}"`);
  }

  if (Number.isFinite(currentYear)) {
    filterConditions.push(
      `and(issue_date.gte.${currentYear - 5}-01-01,issue_date.lte.${currentYear + 5}-12-31)`
    );
  }

  if (filterConditions.length > 0) {
    query = query.or(filterConditions.join(","));
  }

  const { data, error } = await query.limit(50);

  if (error || !data || data.length === 0) {
    const fallback = await supabase
      .from("stamps")
      .select("id, name, issue_date, denomination, theme, image_url")
      .neq("id", currentStamp.id)
      .order("issue_date", { ascending: false })
      .limit(limit);
    return (fallback.data ?? []) as StampAdjacentItem[];
  }

  const scored = data.map((candidate) => {
    let score = 0;
    const candYear = new Date(candidate.issue_date).getFullYear();
    const candNameLower = candidate.name.toLowerCase();

    let matchedKeywordsCount = 0;
    for (const kw of titleKeywords) {
      if (candNameLower.includes(kw)) {
        matchedKeywordsCount++;
      }
    }

    if (matchedKeywordsCount > 0) {
      score += 120 + (matchedKeywordsCount - 1) * 40;
    }

    if (currentStamp.theme && candidate.theme === currentStamp.theme) {
      score += 40;
    }

    if (Number.isFinite(currentYear) && Number.isFinite(candYear)) {
      const yearDiff = Math.abs(currentYear - candYear);
      if (yearDiff === 0) score += 20;
      else if (yearDiff <= 3) score += 12;
      else if (yearDiff <= 8) score += 5;
    }

    return { stamp: candidate as StampAdjacentItem, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.stamp.issue_date || "").localeCompare(a.stamp.issue_date || "");
  });

  return scored.slice(0, limit).map((item) => item.stamp);
}

export const getStampDetails = cache(async (id: string) => {
  const { data: stamp, error } = await supabase
    .from("stamps")
    .select(
      "id, name, issue_date, denomination, theme, description, image_url, first_day_cover_url, brochure_image1_url, brochure_image2_url, keywords"
    )
    .eq("id", id)
    .single();

  if (error || !stamp) {
    return {
      error: error?.message || "Stamp not found",
      stamp: null as StampRecord | null,
      previousStamps: [] as StampAdjacentItem[],
      nextStamps: [] as StampAdjacentItem[],
      relatedStamps: [] as StampAdjacentItem[],
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const [previousResult, nextResult, relatedStamps, yearsResult] = await Promise.all([
    supabase
      .from("stamps")
      .select("id, name, issue_date, denomination, theme, image_url")
      .lt("issue_date", stamp.issue_date)
      .order("issue_date", { ascending: false })
      .limit(3),
    supabase
      .from("stamps")
      .select("id, name, issue_date, denomination, theme, image_url")
      .gt("issue_date", stamp.issue_date)
      .order("issue_date", { ascending: true })
      .limit(3),
    getRelatedStamps(stamp as StampRecord, 6),
    getAllStampDates(),
  ]);

  const queryError = previousResult.error ?? nextResult.error;

  if (queryError || yearsResult.error) {
    return {
      error: queryError?.message ?? yearsResult.error,
      stamp: stamp as StampRecord,
      previousStamps: [] as StampAdjacentItem[],
      nextStamps: [] as StampAdjacentItem[],
      relatedStamps: [] as StampAdjacentItem[],
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const allStampsWithDate = yearsResult.data;

  return {
    error: null,
    stamp: stamp as StampRecord,
    previousStamps: (previousResult.data ?? []) as StampAdjacentItem[],
    nextStamps: (nextResult.data ?? []) as StampAdjacentItem[],
    relatedStamps,
    years: getYearsFromStamps(allStampsWithDate),
    issuesCountMap: getIssuesCountByYear(allStampsWithDate),
  };
});

export async function searchStamps(q: string | null) {
  if (!q) {
    return [] as StampSearchResult[];
  }

  const searchTerm = q.trim();

  if (!searchTerm) {
    return [] as StampSearchResult[];
  }

  const { data, error } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, theme, image_url")
    .or(
      `name.ilike.%${searchTerm}%,theme.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    )
    .order("issue_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StampSearchResult[];
}

export async function searchStampsByTheme(theme: string | null) {
  const searchTerm = theme?.trim().toLocaleLowerCase();
  const canonicalTheme = THEME_DEFINITIONS.find(
    (definition) => definition.title.toLocaleLowerCase() === searchTerm,
  )?.title;

  if (!canonicalTheme) {
    return [] as StampSearchResult[];
  }

  const { data, error } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, theme, image_url")
    .ilike("theme", canonicalTheme)
    .order("issue_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StampSearchResult[];
}

export async function getThemesPageData() {
  const [{ count: totalCatalogedStamps, error: countError }, { data: earliestStamp, error: yearError }] =
    await Promise.all([
      supabase.from("stamps").select("id", { count: "exact", head: true }),
      supabase
        .from("stamps")
        .select("issue_date")
        .not("issue_date", "is", null)
        .order("issue_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  if (countError || yearError) {
    return {
      error: countError?.message || yearError?.message || "Unable to load catalogue totals.",
      themes: [] as CuratedTheme[],
      totalThemesCount: 0,
      totalCatalogedStamps: 0,
      earliestYear: 1947,
    };
  }

  const earliestYear = earliestStamp?.issue_date
    ? new Date(earliestStamp.issue_date).getFullYear()
    : 1947;

  const themeResults = await Promise.all(
    THEME_DEFINITIONS.map(async (definition) => {
      const [{ count, error: themeCountError }, { data: imageStamp, error: imageError }] =
        await Promise.all([
          supabase
            .from("stamps")
            .select("id", { count: "exact", head: true })
            .ilike("theme", definition.title),
          supabase
            .from("stamps")
            .select("image_url")
            .ilike("theme", definition.title)
            .not("image_url", "is", null)
            .order("issue_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (themeCountError || imageError) {
        return {
          error: themeCountError?.message || imageError?.message || "Unable to load theme data.",
        };
      }

      return {
        theme: {
          ...definition,
          count: count ?? 0,
          featuredImage:
            imageStamp?.image_url || "https://indianstampcatalog.vercel.app/favicon.ico",
        } satisfies CuratedTheme,
      };
    }),
  );

  const failedTheme = themeResults.find((result) => "error" in result);
  if (failedTheme && "error" in failedTheme) {
    return {
      error: failedTheme.error,
      themes: [] as CuratedTheme[],
      totalThemesCount: 0,
      totalCatalogedStamps: 0,
      earliestYear: 1947,
    };
  }

  const populatedThemes: CuratedTheme[] = [];
  for (const result of themeResults) {
    if ("theme" in result && result.theme) {
      populatedThemes.push(result.theme);
    }
  }

  return {
    error: null,
    themes: populatedThemes,
    totalThemesCount: populatedThemes.length,
    totalCatalogedStamps: totalCatalogedStamps ?? 0,
    earliestYear: Number.isFinite(earliestYear) ? earliestYear : 1947,
  };
}