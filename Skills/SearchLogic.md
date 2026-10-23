---
name: search-tile-grid
description: "Use when reviewing or changing catalogue search, grid/tile and table results, URL-synced filters, sorting, pagination, or responsive behavior."
---

# Catalogue Search and Results Views

Use this skill to review or implement the Indian stamp catalogue search experience. The feature requirements are documented in [Search-TileandGrid.md](./Search-TileandGrid.md).

## Implementation Map

- `app/search/page.tsx` reads the search query and fetches initial matches.
- `lib/catalog.ts` implements `searchStamps`; search currently matches name, theme, and description.
- `app/components/search-results-client.tsx` owns URL-derived state, view-specific filtering, sorting, pagination, and result rendering.
- `app/components/results-table.tsx` renders the table, sorting controls, filter popovers, and its empty state.
- `app/components/pagination-controls.tsx` renders the page-size selector and page navigation.
- `app/components/view-toggle.tsx` renders the desktop view toggle.

## Theme Counts and Theme-Only Results

- The Themes page calls `getThemesPageData` in `lib/catalog.ts`. It uses Supabase exact-count queries for total catalogue rows and for each curated theme, avoiding the default row cap that made counts computed from fetched rows incomplete. Theme counts use the same case-insensitive exact `theme` match as theme-result search. The page separately fetches the earliest issue date and a featured image per theme.
- Theme cards link to `/search?themeTitle=<full theme title>`; they must not use the first word of the category as a general search query.
- In `app/search/page.tsx`, a supplied `themeTitle` takes precedence over `q` and calls `searchStampsByTheme`. That function accepts only curated theme titles and filters the `stamps.theme` column using case-insensitive exact `ILIKE` (no wildcard characters are added). The results include the usual stamp display fields and are ordered newest first.
- General text search remains a separate behavior: `q` searches name, theme, and description only when `themeTitle` is not supplied.

## Catalogue Counts and Year Data

- Supabase limits rows returned by a normal query. Do not calculate catalogue-wide totals or year counts from one unpaginated `.select()` response.
- `getHomePageData` gets the catalogue total with an exact count query and obtains all stamp IDs/dates through `getAllStampDates`. That helper uses stable ordering and `.range()` pagination so year lists, per-year issue counts, and sitemap stamp URLs remain complete beyond the default row limit.
- The homepage, year pages, stamp-detail year widget, and sitemap share this paginated fetch. Year aggregation skips null or invalid dates, while the sitemap still includes stamps without dates. Keep the exact-count total separate so undated stamps remain included in the catalogue total.

## Exact Primary Search Behavior

The primary search is implemented by `searchStamps` in `lib/catalog.ts` and called from `app/search/page.tsx`.

- **Input:** The search page reads the `q` URL parameter, trims whitespace, and passes it to `searchStamps`. The helper trims it again. A missing or whitespace-only query returns an empty result list; it does not return the whole catalogue.
- **Database table and searched columns:** It queries the Supabase `stamps` table and ORs matches across `name`, `theme`, and `description`. It does not search `issue_date`, `denomination`, `keywords`, or other columns as part of the primary query.
- **Returned columns:** Matching rows select `id`, `name`, `issue_date`, `denomination`, `theme`, and `image_url`. `issue_date` is also used to order matches newest first; it is not searched.
- **Matching:** Each condition uses Postgres `ILIKE` with `%` added before and after the input: `name.ilike.%<q>%`, `theme.ilike.%<q>%`, and `description.ilike.%<q>%`. Matching is case-insensitive and substring-based; a term may occur anywhere in any one searched field. All three conditions are joined with OR, so a row matching any one field is included. There is no tokenization, stemming, fuzzy matching, or requirement that every word match.
- **Input normalization:** Only leading and trailing whitespace is removed. The primary query is not lowercased or otherwise normalized in application code; case-insensitivity comes from `ILIKE`.
- **Wildcards:** `%` and `_` are Postgres `LIKE`/`ILIKE` pattern metacharacters. Since the input is interpolated directly into a pattern already surrounded by `%`, a typed `%` can match any sequence of characters and `_` can match one character; they are not escaped to require literal percent/underscore characters. `*` and `?` are not Postgres `LIKE` wildcards and are ordinarily matched literally.
- **Special characters and errors:** The input is interpolated directly into Supabase `.or()` filter syntax without escaping or quoting. Besides SQL pattern metacharacters, punctuation reserved by PostgREST's filter grammar (notably commas and parentheses) can affect parsing or make a query fail rather than behave like a literal substring. Do not claim arbitrary punctuation is safely literal. The helper throws when Supabase returns an error; it does not silently turn a failed search into an empty success.
- **Result ordering:** The database orders matching records by `issue_date` descending before returning them.

The result view's filters are a separate, client-side stage over the rows returned by the primary search. They cannot add records that the `q` query did not fetch. The grid theme/decade/denomination controls and table title/category/year/denomination filters are not additional database search columns.

| Example input | Current primary-search meaning |
| --- | --- |
| `gandhi` | Case-insensitive substring in name, theme, or description |
| `gandhi stamp` | The literal phrase as a substring; not two independently tokenized terms |
| `%` | A broad pattern that can match any sequence in one of the searched fields |
| `_` | Matches one character in the pattern |
| `*` or `?` | Not wildcard operators for `ILIKE`; ordinarily literal characters |
| `name,theme` or parentheses | May be interpreted as `.or()` grammar, not necessarily literal query text |

## Workflow

1. Read the feature requirements and the implementation files above before making a change. Check the current repository patterns and the installed Next.js guides for any Next.js API changes relevant to the work.
2. Trace the complete data flow: URL query → server search → initial results → active-view filters → sorting → page slice → rendered results.
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

- Search should match only the intended catalogue fields and should behave predictably for empty input and punctuation.
- Normalize text consistently for case-insensitive matching. Use meaningful denomination tokens or explicit normalized categories; do not match a category using a single-character substring such as `a`, `p`, or `r`, which creates false positives.
- When a decade or year range is active, reject records whose issue date is missing or cannot be parsed. Do not let a blank date pass a decade filter simply because the date condition was skipped.
- Make category filtering an exact membership check against the allowed category values.
- Ensure changing one view's filters does not cause filters from the other view to affect its result set.
- Clamp or normalize out-of-range page values so the displayed page and URL cannot disagree.
- Verify pagination uses the filtered count, including the `All` page-size option, and hides controls below the configured minimum result count.

## Completion

Summarize the paths and behavior changed, list any confirmed logic issues that were not fixed, and report the validation performed and its outcome.
