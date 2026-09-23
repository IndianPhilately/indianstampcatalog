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
  query: string;
  fallbackImage: string;
  count: number;
  featuredImage?: string | null;
};

const THEME_DEFINITIONS: Omit<CuratedTheme, "count" | "featuredImage">[] = [
  {
    id: "national-symbols",
    title: "National Symbols & Identity",
    subtitle: "Emblems, flags, constitution, and statehood insignia",
    description:
      "The Ashoka Lion Capital, the Tricolour, constitutional milestones, and symbols defining sovereign democratic India.",
    query: "Flag",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/India_1947_stamp_flag.jpg/240px-India_1947_stamp_flag.jpg",
  },
  {
    id: "leaders",
    title: "Leaders & Personalities",
    subtitle: "Memorial and statehood personalities",
    description:
      "Freedom fighters, constitutional architects, social reformers, Nobel laureates, and visionary heads of state.",
    query: "Personality",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Mahatma_Gandhi_1948_stamp_of_India.jpg/240px-Mahatma_Gandhi_1948_stamp_of_India.jpg",
  },
  {
    id: "historical-events",
    title: "Historical Events & Anniversaries",
    subtitle: "Freedom struggle landmarks and centenaries",
    description:
      "Turning points of the freedom struggle, centenaries of national institutions, treaty signings, and jubilee milestones.",
    query: "History",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Air_Force_stamp_1967.jpg/240px-Air_Force_stamp_1967.jpg",
  },
  {
    id: "wildlife-nature",
    title: "Wildlife & Nature",
    subtitle: "Endangered fauna, national parks, and botanical heritage",
    description:
      "Royal Bengal tigers, Asiatic lions, Himalayan wildflowers, migratory birds, and forest biodiversity preserves.",
    query: "Wildlife",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Indian_Tiger_stamp.jpg/240px-Indian_Tiger_stamp.jpg",
  },
  {
    id: "art-culture",
    title: "Art, Culture & Mythology",
    subtitle: "Dance, epic folklore, and traditional handicrafts",
    description:
      "Classical dances (Kathakali, Bharatanatyam), miniature ragamala paintings, folk handicrafts, and ancient epics.",
    query: "Art",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Kathakali_1971_stamp_of_India.jpg/240px-Kathakali_1971_stamp_of_India.jpg",
  },
  {
    id: "science-tech",
    title: "Science, Technology & Space",
    subtitle: "Space exploration, research, atomic energy, and pioneers",
    description:
      "Satellite launch vehicles, nuclear research pioneers, technological self-reliance, and premier scientific institutes.",
    query: "Science",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Air_India_International_1948_stamp.jpg/240px-Air_India_International_1948_stamp.jpg",
  },
  {
    id: "sports-international",
    title: "Sports & International Relations",
    subtitle: "Asian Games, Olympics, global summits, and diplomacy",
    description:
      "Historic Asian and Commonwealth Games, Olympic representations, United Nations commemorations, and international treaties.",
    query: "Sports",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/First_Asian_Games_1951_stamp.jpg/240px-First_Asian_Games_1951_stamp.jpg",
  },
  {
    id: "landmarks-heritage",
    title: "Landmarks, Architecture & Heritage Sites",
    subtitle: "UNESCO monuments, forts, and historic temples",
    description:
      "UNESCO World Heritage monuments, hill forts of Rajasthan, Dravidian temple towers, and colonial landmarks.",
    query: "Architecture",
    fallbackImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Brihadisvara_Temple_stamp.jpg/240px-Brihadisvara_Temple_stamp.jpg",
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
  stamps: Array<{ issue_date: string }>
): number[] {
  return Array.from(
    new Set(
      stamps
        .map((stamp) => new Date(stamp.issue_date).getFullYear())
        .filter((year) => Number.isFinite(year))
    )
  ).sort((a, b) => b - a);
}

export function getIssuesCountByYear(
  stamps: Array<{ issue_date: string }>
): Record<number, number> {
  const map: Record<number, number> = {};
  for (const stamp of stamps) {
    const yr = new Date(stamp.issue_date).getFullYear();
    if (Number.isFinite(yr)) {
      map[yr] = (map[yr] || 0) + 1;
    }
  }
  return map;
}

export async function getHomePageData() {
  const { data: stamps, error } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, image_url, description")
    .order("issue_date", { ascending: false });

  if (error) {
    return {
      error: error.message,
      stampCount: 0,
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
      latestStamp: null as StampSummary | null,
      recentStamps: [] as StampSummary[],
      randomStamps: [] as StampSummary[],
    };
  }

  const catalogStamps = (stamps ?? []) as StampSummary[];

  return {
    error: null,
    stampCount: catalogStamps.length,
    years: getYearsFromStamps(catalogStamps),
    issuesCountMap: getIssuesCountByYear(catalogStamps),
    latestStamp: catalogStamps[0] ?? null,
    recentStamps: catalogStamps.slice(1, 4),
    randomStamps: [...catalogStamps].sort(() => Math.random() - 0.5).slice(0, 5),
  };
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

  const { data: stamps, error } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, theme, image_url")
    .gte("issue_date", `${yearNumber}-01-01`)
    .lt("issue_date", `${yearNumber + 1}-01-01`)
    .order("issue_date", { ascending: true });

  if (error) {
    return {
      error: error.message,
      stamps: [] as StampYearItem[],
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const yearStamps = (stamps ?? []) as StampYearItem[];

  const { data: yearData, error: yearError } = await supabase
    .from("stamps")
    .select("issue_date")
    .order("issue_date", { ascending: false });

  if (yearError) {
    return {
      error: yearError.message,
      stamps: yearStamps,
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const allStampsWithDate = (yearData ?? []) as Array<{ issue_date: string }>;

  return {
    error: null,
    stamps: yearStamps,
    years: getYearsFromStamps(allStampsWithDate),
    issuesCountMap: getIssuesCountByYear(allStampsWithDate),
  };
}

// Extracts meaningful subject words from the stamp title
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

// Ranks related stamps prioritizing Title Subject Overlap (+120), Theme (+40), and Era Proximity (+5 to +20)
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

  // 1. Search title keywords first (e.g. "rabindranath" and "tagore")
  for (const kw of titleKeywords.slice(0, 3)) {
    filterConditions.push(`name.ilike.%${kw}%`);
  }

  // 2. Add theme condition
  if (currentStamp.theme) {
    filterConditions.push(`theme.eq."${currentStamp.theme}"`);
  }

  // 3. Contemporary era candidates as fallback
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

    // 1. Title Keyword Match: High weight ensures subject/person matches ALWAYS take the lead
    let matchedKeywordsCount = 0;
    for (const kw of titleKeywords) {
      if (candNameLower.includes(kw)) {
        matchedKeywordsCount++;
      }
    }

    if (matchedKeywordsCount > 0) {
      // First keyword match = +120; each additional keyword match = +40
      score += 120 + (matchedKeywordsCount - 1) * 40;
    }

    // 2. Theme Affinity (Weight: 40)
    if (currentStamp.theme && candidate.theme === currentStamp.theme) {
      score += 40;
    }

    // 3. Era Proximity (Weight: 5 - 20)
    if (Number.isFinite(currentYear) && Number.isFinite(candYear)) {
      const yearDiff = Math.abs(currentYear - candYear);
      if (yearDiff === 0) score += 20;
      else if (yearDiff <= 3) score += 12;
      else if (yearDiff <= 8) score += 5;
    }

    return { stamp: candidate as StampAdjacentItem, score };
  });

  // Highest score strictly first; issue_date breaks ties
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.stamp.issue_date || "").localeCompare(a.stamp.issue_date || "");
  });

  return scored.slice(0, limit).map((item) => item.stamp);
}

export async function getStampDetails(id: string) {
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
    supabase.from("stamps").select("issue_date").order("issue_date", { ascending: false }),
  ]);

  const queryError = previousResult.error ?? nextResult.error ?? yearsResult.error;

  if (queryError) {
    return {
      error: queryError.message,
      stamp: stamp as StampRecord,
      previousStamps: [] as StampAdjacentItem[],
      nextStamps: [] as StampAdjacentItem[],
      relatedStamps: [] as StampAdjacentItem[],
      years: [] as number[],
      issuesCountMap: {} as Record<number, number>,
    };
  }

  const allStampsWithDate = (yearsResult.data ?? []) as Array<{ issue_date: string }>;

  return {
    error: null,
    stamp: stamp as StampRecord,
    previousStamps: (previousResult.data ?? []) as StampAdjacentItem[],
    nextStamps: (nextResult.data ?? []) as StampAdjacentItem[],
    relatedStamps,
    years: getYearsFromStamps(allStampsWithDate),
    issuesCountMap: getIssuesCountByYear(allStampsWithDate),
  };
}

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

export async function getThemesPageData() {
  const { data: stamps, error } = await supabase
    .from("stamps")
    .select("id, name, theme, image_url, description, issue_date")
    .order("issue_date", { ascending: false });

  if (error) {
    return {
      error: error.message,
      themes: [] as CuratedTheme[],
      totalThemesCount: 0,
      totalCatalogedStamps: 0,
      earliestYear: 1947,
    };
  }

  const catalog = stamps ?? [];
  const totalCatalogedStamps = catalog.length;

  const validYears = catalog
    .map((s) => new Date(s.issue_date).getFullYear())
    .filter((yr) => Number.isFinite(yr));
  const earliestYear = validYears.length > 0 ? Math.min(...validYears) : 1947;

  const populatedThemes: CuratedTheme[] = THEME_DEFINITIONS.map((def) => {
    const qLower = def.query.toLowerCase();
    const titleLower = def.title.toLowerCase();

    const matchingStamps = catalog.filter((s) => {
      const stampTheme = (s.theme || "").toLowerCase();
      const stampName = (s.name || "").toLowerCase();
      const stampDesc = (s.description || "").toLowerCase();

      if (stampTheme && (stampTheme === titleLower || titleLower.includes(stampTheme))) {
        return true;
      }

      switch (def.id) {
        case "national-symbols":
          return (
            stampTheme.includes("symbol") ||
            stampTheme.includes("flag") ||
            stampName.includes("flag") ||
            stampName.includes("lion capital") ||
            stampName.includes("constitution") ||
            stampName.includes("republic")
          );
        case "leaders":
          return (
            stampTheme.includes("personality") ||
            stampTheme.includes("leader") ||
            stampDesc.includes("born") ||
            stampDesc.includes("freedom fighter")
          );
        case "historical-events":
          return (
            stampTheme.includes("history") ||
            stampTheme.includes("centenary") ||
            stampTheme.includes("anniversary") ||
            stampTheme.includes("jubilee")
          );
        case "wildlife-nature":
          return (
            stampTheme.includes("wildlife") ||
            stampTheme.includes("nature") ||
            stampTheme.includes("flora") ||
            stampTheme.includes("fauna") ||
            stampTheme.includes("birds") ||
            stampTheme.includes("animals")
          );
        case "art-culture":
          return (
            stampTheme.includes("art") ||
            stampTheme.includes("culture") ||
            stampTheme.includes("mythology") ||
            stampTheme.includes("dance") ||
            stampTheme.includes("painting")
          );
        case "science-tech":
          return (
            stampTheme.includes("science") ||
            stampTheme.includes("technology") ||
            stampTheme.includes("space") ||
            stampTheme.includes("research") ||
            stampTheme.includes("atomic")
          );
        case "sports-international":
          return (
            stampTheme.includes("sports") ||
            stampTheme.includes("games") ||
            stampTheme.includes("international") ||
            stampTheme.includes("olympic") ||
            stampTheme.includes("summit")
          );
        case "landmarks-heritage":
          return (
            stampTheme.includes("landmark") ||
            stampTheme.includes("architecture") ||
            stampTheme.includes("heritage") ||
            stampTheme.includes("monument") ||
            stampTheme.includes("temple") ||
            stampTheme.includes("fort")
          );
        default:
          return stampTheme.includes(qLower) || stampName.includes(qLower);
      }
    });

    const firstValidImage = matchingStamps.find((s) => Boolean(s.image_url))?.image_url;

    return {
      ...def,
      count: matchingStamps.length,
      featuredImage: firstValidImage || def.fallbackImage,
    };
  });

  return {
    error: null,
    themes: populatedThemes,
    totalThemesCount: populatedThemes.length,
    totalCatalogedStamps,
    earliestYear,
  };
}