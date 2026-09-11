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

export type StampYearItem = Pick<
  StampRecord,
  "id" | "name" | "issue_date" | "denomination" | "image_url"
>;

export type StampAdjacentItem = Pick<
  StampRecord,
  "id" | "name" | "issue_date" | "denomination" | "theme" | "image_url"
>;

export type StampSearchResult = Pick<StampRecord, "id" | "name" | "issue_date" | "image_url">;

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

export async function getHomePageData() {
  const { data: stamps, error } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, image_url, description")
    .order("issue_date", { ascending: false });

  if (error) {
    return {
      error: error.message,
      years: [] as number[],
      latestStamp: null as StampSummary | null,
      randomStamps: [] as StampSummary[],
    };
  }

  const catalogStamps = (stamps ?? []) as StampSummary[];

  return {
    error: null,
    years: getYearsFromStamps(catalogStamps),
    latestStamp: catalogStamps[0] ?? null,
    randomStamps: [...catalogStamps].sort(() => Math.random() - 0.5).slice(0, 5),
  };
}

export async function getYearPageData(year: string) {
  const yearNumber = Number(year);

  if (!Number.isFinite(yearNumber)) {
    return { error: "Invalid year", stamps: [] as StampYearItem[], years: [] as number[] };
  }

  const { data: stamps, error } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, image_url")
    .gte("issue_date", `${yearNumber}-01-01`)
    .lt("issue_date", `${yearNumber + 1}-01-01`)
    .order("issue_date", { ascending: true });

  if (error) {
    return { error: error.message, stamps: [] as StampYearItem[], years: [] as number[] };
  }

  const yearStamps = (stamps ?? []) as StampYearItem[];

  const { data: yearData, error: yearError } = await supabase
    .from("stamps")
    .select("issue_date")
    .order("issue_date", { ascending: false });

  if (yearError) {
    return { error: yearError.message, stamps: yearStamps, years: [] as number[] };
  }

  return {
    error: null,
    stamps: yearStamps,
    years: getYearsFromStamps((yearData ?? []) as Array<{ issue_date: string }>),
  };
}

export async function getStampDetails(id: string) {
  const { data: stamp, error } = await supabase
    .from("stamps")
    .select(
      "id, name, issue_date, denomination, theme, description, image_url, first_day_cover_url, brochure_image1_url, brochure_image2_url, keywords"
    )
    .eq("id", id)
    .single();

  if (error) {
    return {
      error: error.message,
      stamp: null as StampRecord | null,
      previousStamps: [] as StampAdjacentItem[],
      nextStamps: [] as StampAdjacentItem[],
      relatedStamps: [] as StampAdjacentItem[],
      years: [] as number[],
    };
  }

  const { data: adjacentData, error: adjacentError } = await supabase
    .from("stamps")
    .select("id, name, issue_date, denomination, theme, image_url")
    .order("issue_date", { ascending: false });

  if (adjacentError) {
    return {
      error: adjacentError.message,
      stamp: stamp as StampRecord,
      previousStamps: [] as StampAdjacentItem[],
      nextStamps: [] as StampAdjacentItem[],
      relatedStamps: [] as StampAdjacentItem[],
      years: [] as number[],
    };
  }

  const ordered = (adjacentData ?? []) as StampAdjacentItem[];

  const currentIndex = ordered.findIndex((item) => item.id === id);

  const previousStamps = ordered.slice(Math.max(currentIndex - 3, 0), currentIndex).reverse();
  const nextStamps = ordered.slice(currentIndex + 1, currentIndex + 4);
  const relatedStamps = ordered
    .filter((item) => item.id !== id && item.theme === stamp?.theme)
    .slice(0, 3);
  const years = getYearsFromStamps(ordered);

  return {
    error: null,
    stamp: stamp as StampRecord,
    previousStamps,
    nextStamps,
    relatedStamps,
    years,
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
    .select("id, name, issue_date, image_url")
    .or(
      `name.ilike.%${searchTerm}%,theme.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    )
    .order("issue_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StampSearchResult[];
}
