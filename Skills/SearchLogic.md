---
name: search-tile-grid
description: "Use when reviewing or changing catalogue search, grid/tile and table results, URL-synced filters, sorting, pagination, or responsive behavior."
---

# Catalogue Search and Results Views

Use this skill to review or implement the Indian stamp catalogue search experience. The feature requirements are documented in [Search-TileandGrid.md](./Search-TileandGrid.md).

## Implementation Map

- `app/search/page.tsx` reads URL state and renders the client search experience.
- `app/api/search-catalog/route.ts` returns all searchable stamp records using stable, paginated Supabase reads.
- `lib/search-index.ts` builds and queries the client-side MiniSearch index.
- `app/components/search-results-client.tsx` owns URL-derived state, view-specific filtering, sorting, pagination, and result rendering.
- `app/components/results-table.tsx` renders the table, sorting controls, filter popovers, and its empty state.
- `app/components/pagination-controls.tsx` renders the page-size selector and page navigation.
- `app/components/view-toggle.tsx` renders the desktop view toggle.

## Theme Counts and Theme-Only Results

- The Themes page calls `getThemesPageData` in `lib/catalog.ts`. It uses Supabase exact-count queries for total catalogue rows and for each curated theme, avoiding the default row cap that made counts computed from fetched rows incomplete. Theme counts use the same case-insensitive exact `theme` match as theme-result search. The page separately fetches the earliest issue date and a featured image per theme.
- Theme cards link to `/search?themeTitle=<full theme title>`; they must not use the first word of the category as a general search query.
- A supplied `themeTitle` takes precedence over `q` and matches a curated theme title exactly against the loaded catalogue's `theme` values. Theme mode does not use fuzzy or prefix matching; results are ordered newest first.
- General text search indexes name, theme, and description only when `themeTitle` is not supplied.

## Catalogue Counts and Year Data

- Supabase limits rows returned by a normal query. Do not calculate catalogue-wide totals or year counts from one unpaginated `.select()` response.
- `getHomePageData` gets the catalogue total with an exact count query and obtains all stamp IDs/dates through `getAllStampDates`. That helper uses stable ordering and `.range()` pagination so year lists, per-year issue counts, and sitemap stamp URLs remain complete beyond the default row limit.
- The homepage, year pages, stamp-detail year widget, and sitemap share this paginated fetch. Year aggregation skips null or invalid dates, while the sitemap still includes stamps without dates. Keep the exact-count total separate so undated stamps remain included in the catalogue total.

## MiniSearch Primary Search Behavior

The browser builds one MiniSearch index from the complete, versioned catalogue response served by `app/api/search-catalog/route.ts`.

- **Catalogue fields:** The endpoint selects `id`, `name`, `theme`, `description`, `issue_date`, `denomination`, and `image_url` from `stamps`. Only `name`, `theme`, and `description` are indexed. Dates and denominations are for display, sorting, and filters, not text matching.
- **Complete fetch:** The endpoint obtains the exact row count, pages through results with stable ID ordering, then verifies count and ID uniqueness before returning success. Failed or partial loads return an error and the client offers retry; they must not appear as zero search matches.
- **Cache freshness:** The browser revalidates its in-memory catalogue index after five minutes, checking at least once per minute and when the search tab becomes visible. Successful refreshes replace the index; a failed background refresh keeps the last usable results visible and exposes a retry notice. The API advertises a five-minute shared-cache TTL with stale-while-revalidate; production CDN behavior still requires verification.
- **Normalization and tokens:** Search and indexed terms use Unicode NFKC normalization and lowercase conversion; diacritics are preserved. Unicode letters, combining marks, and numbers form tokens; punctuation separates them. There is no stemming or stop-word removal.
- **Matching:** Multiple terms use AND semantics and may match across indexed fields on the same stamp. Each token first uses exact and prefix matching (prefix only for tokens longer than three characters). Only when that token has no exact/prefix matches does it fall back to `0.2` fuzzy matching (MiniSearch rounds edit distance, capped at two) and exact adjacent-transposition alternatives for terms four through seven characters. This lets `nerhu` match `Nehru` without returning `Swamp` for `Stamp` when exact/prefix matches exist. Longer typo terms use MiniSearch's fuzzy fallback; terms up to three characters remain exact. Fallback is per token, preserving AND behavior for multi-token queries.
- **Special characters:** Punctuation is not wildcard syntax. `%`, `_`, `*`, and `?` are token separators, and punctuation-only input returns no matches.
- **Themes:** `themeTitle` overrides `q`, is validated against curated theme names, and uses normalized exact equality rather than fuzzy or prefix search.
- **Empty query:** Missing or whitespace-only `q` shows all catalogue records, newest issue dates first.
- **Ordering:** Non-empty text search defaults to MiniSearch relevance; equal scores break by issue date descending and stable ID. An explicit sort overrides relevance. Blank and exact-theme results default to newest first.
- **Query length:** Search queries are limited to 200 characters.

The result view's filters run locally after text or exact-theme matching. Grid theme/decade/denomination and table title/category/year/denomination filters are not additional text-search fields.

| Example input | MiniSearch meaning |
| --- | --- |
| `gandhi` | Case-insensitive token match in name, theme, or description; exact/prefix matches take precedence over fuzzy matches |
| `nerhu` | Can match `Nehru` through typo fallback when there are no exact/prefix matches for that token |
| `Stamp` | Does not return near-matches such as `Swamp` if exact/prefix matches exist |
| `gandhi stamp` | Both terms must match the same stamp, possibly across different indexed fields |
| `%`, `_`, `*`, `?` | Punctuation separators, not wildcards; punctuation-only input returns no matches |

## Workflow

1. Read the feature requirements and implementation files above before making a change. Check current repository patterns and the installed Next.js guides for relevant API changes.
2. Trace the complete data flow: URL query → catalogue fetch/index → local search → active-view filters → sorting → page slice → rendered results. Verify catalogue refresh after five minutes and on tab visibility, with request deduplication and stale-result retention if refresh fails.
3. Preserve the independent filter behavior:
   - Grid view applies the header theme, decade, and denomination filters.
   - Table view applies the title, category, year-range, and denomination column filters.
   - Keep both sets of values in the URL when switching views, but do not apply the hidden view's filters.
4. Treat URL values as untrusted input. Validate view, page, page size, sort, categories, and years; keep defaults consistent with the UI. Preserve unrelated query parameters and the URL hash when updating search state.
5. Reset the page when the primary query, an applied column filter, or page size changes. Keep URL state compatible with browser back/forward navigation.
6. Apply sort and active-view filters before calculating the total and slicing the page. Keep pagination visibility and empty states consistent with the filtered result count.
7. Preserve the responsive contract: the table toggle/table view are desktop-only; below `md`, render the grid while retaining table-specific URL filters for later desktop use.
8. Validate keyboard operation and accessible names/states for view toggles, sortable headers, filter dialogs, and pagination. Confirm filters can be applied, cleared, and dismissed with Escape or outside interaction.
9. Run the narrowest relevant lint, type-check, build, or test command available. If there are no focused tests, manually verify URL reload, view switching, filter clearing, sort order, page reset, and mobile behavior.

## Search and Filter Review Checks

- Search should match only the intended catalogue fields and behave predictably for empty input and punctuation.
- Normalize text consistently for case-insensitive matching. Use meaningful denomination tokens or explicit normalized categories; do not match a category using a single-character substring such as `a`, `p`, or `r`, which creates false positives.
- When a decade or year range is active, reject records whose issue date is missing or cannot be parsed. Do not let a blank date pass a decade filter simply because the date condition was skipped.
- Make category filtering an exact membership check against the allowed category values.
- Ensure changing one view's filters does not cause filters from the other view to affect its result set.
- Clamp or normalize out-of-range page values so the displayed page and URL cannot disagree.
- Verify pagination uses the filtered count, including the `All` page-size option, and hides controls below the configured minimum result count.

## Completion

Summarize the paths and behavior changed, list any confirmed logic issues that were not fixed, and report the validation performed and its outcome.
