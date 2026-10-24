---
name: catalogue-search-engine
description: "Use when modifying, reviewing, or debugging catalogue search, MiniSearch indexing, query matching and ranking, catalogue data delivery, or downstream result filters."
---

# Stamp Catalogue Search Engine

Use this skill when changing or debugging the Indian stamp catalogue search flow. MiniSearch is the client-side text matcher; Supabase remains the catalogue source of truth. Do not claim performance or free-tier savings until measured.

## 1. Target Architecture and Data Flow

1. `app/search/page.tsx` renders the search shell and passes URL state. It does not issue a database text-search query for `q`.
2. `app/api/search-catalog/route.ts` fetches the public searchable fields from `stamps`, using deterministic `.range()` pagination with a unique tie-breaker. A single Supabase select is not complete once the table exceeds the configured row cap.
3. The endpoint returns a versioned JSON payload containing the complete catalogue rows needed for search and result rendering: `id`, `name`, `theme`, `description`, `issue_date`, `denomination`, and `image_url`, plus the expected total row count. Check that fetched IDs are unique and their count matches the expected total under the endpoint's actual RLS policy. If the database changes during pagination, fail explicitly rather than caching partial data. Do not expose a service-role key or other privileged credential.
4. On the search page, fetch the payload and build the MiniSearch index once, retaining a separate `id -> display record` map. Reuse the in-memory index for five minutes, then revalidate it; while the search page stays open, check at least once per minute and when the tab becomes visible. Index `name`, `theme`, and `description`; store only fields required for result cards and filters (`id`, `name`, `theme`, `issue_date`, `denomination`, `image_url`). Do not duplicate full descriptions in `storeFields`.
5. Query changes run locally against the existing index. Apply active-view filters to matching records while preserving MiniSearch score order, then apply explicit user sorting if selected, then paginate. Filter, sort, page, and view changes must not rebuild the index or refetch the catalogue.
6. Bound query length and avoid expensive repeat work while a user types. Any debounce must apply only to local search and must not trigger network requests per keystroke.

### Data freshness and caching

- The catalogue is public data, but its freshness still matters. Do not assume deployment automatically invalidates every Vercel edge cache, and do not assume an hour-long browser cache is acceptable.
- Start with an edge policy no longer than `s-maxage=300, stale-while-revalidate=3600` and browser `max-age=0`; verify the deployed route actually honors these headers. Add ETag/conditional requests only if implemented and tested.
- Supabase edits can occur without a deployment. If a reliable mutation hook exists, invalidate/revalidate the catalogue endpoint after writes. Otherwise, document the TTL as the freshness bound and provide a retry/refresh path for users with a loaded stale index.
- Revalidate the browser-side index after five minutes. If refresh fails, keep the last loaded results available and show a clear retry action rather than replacing usable results with an error screen.
- Test the endpoint after both a deployment and a catalogue data change. Never return partial pages as a cacheable success if any page request fails.
- Paginated reads are not automatically transactional snapshots. Count validation detects many concurrent changes but does not provide a point-in-time snapshot if strict consistency is required.

## 2. MiniSearch Index and Matching

Index construction and query configuration are in `lib/search-index.ts`. Check the installed MiniSearch version's API before changing the options.

### Indexed and stored fields

- Index only `name`, `theme`, and `description`, matching the current general-search field scope. Do not silently add `keywords`, denomination, or dates as searchable text; propose and test such a behavior change separately.
- Boost `name: 4`, `theme: 2.5`, and `description: 1` as initial ranking weights, not as a guarantee that every title hit beats every description hit. Validate real results and adjust only from a documented relevance test set.
- Store `id`, `name`, `theme`, `issue_date`, `denomination`, and `image_url` for rendering and filters. Keep `description` indexed but out of `storeFields`; retain only the display record map needed by the UI.

### Normalization and matching contract

- Normalize indexed text and query consistently with Unicode NFKC and lowercase conversion. Preserve diacritics (for example, `cafe` does not match `café`); do not imply transliteration or stemming unless added explicitly.
- Use a tokenizer that extracts Unicode letters and digits. Punctuation separates tokens; it is not SQL or MiniSearch wildcard syntax. Quotes, commas, parentheses, hyphens, `%`, `_`, `*`, and `?` must not throw. A punctuation-only query produces no text matches.
- Do not remove stop words by default: with `AND` matching, removing them changes query meaning. If a stop-word list is introduced, test it against real catalogue titles and descriptions.
- Combine multiple meaningful query terms with `AND`; terms may match across indexed fields on the same stamp. Do not silently fall back to `OR` when no result is found.
- First search each token with exact and prefix matching (prefix only for tokens longer than three characters). Only if that token has no exact/prefix matches, retry it with `0.2` fuzzy matching (MiniSearch rounds the resulting edit distance, capped at two) and exact adjacent-transposition alternatives for tokens from four through seven characters. This preserves typo recovery such as `nerhu` → `Nehru` while preventing fuzzy near-matches such as `Stamp` → `Swamp` when exact/prefix matches exist. Longer typo terms use MiniSearch's fuzzy fallback; terms up to three characters remain exact. Keep this fallback per token so multi-token `AND` searches can still recover a misspelled token without broadening tokens that already match.
- Do not claim field boosts guarantee a strict ranking tier. Sort primarily by MiniSearch score; use `issue_date` descending and then stable `id` ordering only as deterministic tie-breakers for equal scores.
- An empty/whitespace `q` intentionally returns the whole loaded catalogue, filtered by the active view and sorted by `issue_date` descending. This differs from the old search route, where no `q` returned no records. Preserve this as an explicit product behavior, not an accidental MiniSearch default.

## 3. Theme Search, URL State, and Result Views

- Theme-card navigation continues to use `themeTitle` with the full curated category title. It is a separate exact-match mode: trim and normalize the title, validate it against `THEME_DEFINITIONS`, then compare normalized `stamp.theme` for exact equality. Never run fuzzy or prefix matching for `themeTitle`; unknown categories return no matches.
- If `themeTitle` and `q` are both present, `themeTitle` takes precedence, matching existing behavior.
- For normal non-empty text queries, relevance order is the default. Do not let the current default `date-desc` sort overwrite MiniSearch ranking. If the user explicitly selects a date/title/category/denomination sort, that sort overrides relevance; clearing it restores relevance for text searches and date-descending order for blank/theme-only results. Reflect this default in the URL and controls without breaking browser back/forward.
- Preserve view-specific filter behavior:
  - Grid applies its header theme, decade, and denomination filters.
  - Table applies title, category, year-range, and denomination column filters.
  - Persist both filter sets in the URL, but apply only the active view's set.
- Apply filters before calculating the filtered result count and pagination slice. Reset page to 1 when `q`, an applied filter, or page size changes. Keep table filters independent from the exact theme-card mode unless the UI explicitly specifies otherwise.
- While typing, update `q` with `history.replaceState` (or the existing Next-supported URL-state pattern) to avoid one history entry per character; use an explicit submit/navigation action for a `push` entry if that matches current UX. Verify reload and back/forward behavior.
- Distinguish loading, fetch/index errors, zero text matches, and zero matches after filters. A failed or partial catalogue load must not look like a valid empty search. Provide a retry path.

## 4. Supabase and Performance Expectations

MiniSearch removes per-query database matching only after the browser has downloaded the catalogue. It does **not** remove Supabase reads: the endpoint fetches every search record at least once per cache miss, and pagination may require multiple database requests. It can reduce repeated `.or(...ilike...)` queries, server-side search invocations, and connection churn when users issue many searches against one loaded index. It may increase payload, bandwidth, memory, cold-page latency, and work for one-off visitors.

### Local validation and rollback

- Use MiniSearch as the sole search path; do not add a feature flag, A/B cohort, or duplicate Supabase text-search implementation just for rollout.
- Test locally before deployment using the verification checklist below, including complete results, representative query relevance, loading/error/retry behavior, and mobile performance where practical.
- Keep Supabase as the catalogue source of truth. MiniSearch still fetches the search corpus from the catalogue endpoint; this design changes where text matching happens, not where catalogue data is stored.
- On catalogue load or index failure, show a clear error and retry path. Do not disguise a failed or partial index as a valid empty result set.
- If a deployed release has unacceptable regressions, roll back through the deployment platform or revert the relevant Git change and redeploy. Keep the previous known-good commit/deployment identifiable; a code-level duplicate search implementation is not required for rollback.

Before deployment, measure the MiniSearch implementation:

- Supabase requests and rows read per cache miss, cache-hit rate, and behavior beyond 1,000 rows.
- Compressed and uncompressed payload sizes, browser memory, and index build time on representative desktop and mobile devices.
- First-result latency for the first visit versus repeat searches after indexing.
- Freshness after a direct Supabase edit and after deployment.

Replace the original unverified `20–50 ms` and automatic-global-invalidation claims with measured results. If full descriptions make the payload too large, consider a compact search corpus or a server-generated, versioned MiniSearch index; do not truncate records or search only the first page.

## 5. Verification Checklist

1. Test catalogue sizes below, at, and above the 1,000-row page boundary, including a full final page and records with null dates. Verify no duplicate or missing IDs, and report page-fetch failures.
2. Verify network behavior: one payload fetch when entering search (with shared-cache hits where available), no Supabase or route request on each keystroke, and no refetch/reindex for view, filter, sort, and page changes.
   Verify refresh after five minutes and on tab visibility, with concurrent refreshes deduplicated and stale results retained with a visible retry path after refresh failure.
3. Test exact themes, invalid themes, and simultaneous `q` + `themeTitle`; theme mode must not fuzzy-match other categories.
4. Test empty query, one- and multi-token AND queries across fields, prefixes, short exact tokens, fuzzy typos, no matches, stop words, and punctuation-only input. Include a precedence regression: `Stamp` must not return `Swamp` when exact/prefix matches exist, while `nerhu` must still find `Nehru` when no exact/prefix match exists.
5. Use fixtures to check title-vs-description ranking, equal-score date-descending tie-breaks, and stable ID tie-breaks. Do not assert a strict title-over-description guarantee unless the algorithm explicitly enforces it.
6. Test special characters (`()"' , - % _ * ?`), Unicode, diacritics, and long input without exceptions or unexpected broad matches.
7. Test sorting, independent view filters, URL reload/back/forward, page resets, pagination counts, empty states, loading errors, and retry.
8. Verify cache headers, expiry/revalidation, stale-data behavior, and direct database edits in the deployed environment.
9. Run lint, type-check, build, focused tests, and a local browser smoke test. Record payload size, index-build time, and search latency; compare with existing baseline measurements if available, without requiring both search paths to remain in the application.
10. Confirm the previous known-good commit or deployment can be restored, then deploy only after local validation passes. Monitor search errors and user-reported regressions and roll back if needed.
