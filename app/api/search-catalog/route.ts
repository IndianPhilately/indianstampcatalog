import { supabase } from "@/lib/supabaseClient";
import type { SearchCatalogueRecord } from "@/lib/search-index";

const PAGE_SIZE = 500;
const CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=3600";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { count, error: countError } = await supabase
      .from("stamps")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Could not count searchable stamps: ${countError.message}`);
    }
    if (count === null) {
      throw new Error("Supabase did not return the searchable stamp count.");
    }

    const records: SearchCatalogueRecord[] = [];
    for (let offset = 0; offset < count; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("stamps")
        .select("id, name, theme, description, issue_date, denomination, image_url")
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Could not fetch search catalogue page: ${error.message}`);
      }
      records.push(...(data ?? []));
    }

    const ids = new Set(records.map((record) => record.id));
    const { count: finalCount, error: finalCountError } = await supabase
      .from("stamps")
      .select("id", { count: "exact", head: true });

    if (finalCountError) {
      throw new Error(`Could not verify searchable stamp count: ${finalCountError.message}`);
    }
    if (records.length !== count || ids.size !== records.length || finalCount !== count) {
      throw new Error(
        `Search catalogue changed during pagination (expected ${count}, received ${records.length}, current count ${finalCount}).`,
      );
    }

    return Response.json(
      { version: 1, total: count, records },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (error) {
    console.error("Failed to load the search catalogue.", error);
    return Response.json(
      { error: "The search catalogue could not be loaded. Please try again." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
