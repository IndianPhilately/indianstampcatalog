---
name: related-stamps
description: "Use when implementing, reviewing, or debugging semantic related-stamp recommendations using Supabase pgvector embeddings and the stamp-detail card."
---

# Related Stamps (Semantic Vector Matching)

This skill documents the semantic related-stamp behavior for `/stamp/[id]`. Recommendations are selected by cosine similarity between precomputed stamp embeddings in PostgreSQL using `pgvector`; they are not selected by title keywords, matching themes, or date proximity.

## Implementation Status

`lib/catalog.ts` calls `match_related_stamps`; `scripts/generate-embeddings.ts` generates vectors locally. The migration defining the RPC is `supabase/migrations/20261024120000_match_related_stamps.sql`. Apply that migration to the Supabase project and verify its schema matches the existing `embedding` column before deploying the application.

## Target Data Flow

1. `app/stamp/[id]/page.tsx` gets stamp details via `getStampDetails` in `lib/catalog.ts`.
2. `getStampDetails` calls `getRelatedStamps` with the current stamp ID.
3. `getRelatedStamps` calls the Supabase RPC `match_related_stamps`, requesting up to six neighbors and validating the RPC result shape.
4. PostgreSQL excludes the current stamp and records without embeddings, ranks the remaining records by cosine distance, and returns the nearest matches.
5. The stamp page displays at most the first six results in the Related Stamps card. Its three-column grid lays these out in two rows. The card is omitted when there are no results.

## Database and RPC Contract

The `public.stamps` table must have an `embedding` column with the same vector dimension and model contract used by the embedding generator. The proposed model is `Xenova/all-MiniLM-L6-v2` with 384-dimensional embeddings stored as `extensions.vector(384)`. Confirm the actual deployed column type and extension schema before relying on this contract.

The authoritative RPC definition is the migration linked above. Its parameters are `target_id` and `match_count`; it returns the display fields plus a `similarity` value. It excludes the target and rows with null embeddings, sorts by cosine distance ascending with an ID tie-breaker, and caps results at six. The migration expects pgvector's cosine-distance operator in the `extensions` schema.

The database role used by the application must be allowed to execute the RPC and read only the rows the function is intended to expose. Verify behavior under the app's actual Supabase key and row-level security policies; do not put a service-role key in browser-visible configuration.

### Similarity definition

`embedding <=> target.embedding` is pgvector cosine distance. Similarity is `1 - cosine_distance`; higher similarity means closer vectors. Order by distance ascending (equivalent to similarity descending). Do not apply a relevance threshold unless a product requirement is added and validated against real catalogue results. With no threshold, return the nearest available matches up to the requested count.

## Embedding Generation and Freshness

- The local updater uses `Xenova/all-MiniLM-L6-v2`, mean pooling, normalized output, and 384 dimensions. It runs inference on the local CPU; the model is downloaded and cached on first use.
- Its input is `Title: <name>`, optionally followed by `Theme: <theme>` and `Description: <description>`. Descriptions are trimmed to 1,200 characters. Changing this model, pooling/normalization, or text format requires regenerating all vectors.
- Run `npm run embeddings:update` to fill rows whose `embedding` is null. Run `npm run embeddings:update -- --refresh` to regenerate all rows, including after changes to names, themes, or descriptions.
- The updater is restartable and uses ID-ordered keyset pagination. It reports per-record errors, continues past individual failures, and exits nonzero if any row fails. A later missing-only run retries rows that remain null.
- Store `SUPABASE_SERVICE_ROLE_KEY` in the ignored local `.env.local` file alongside `NEXT_PUBLIC_SUPABASE_URL`, or set it in the process environment. The updater uses this privileged key only in the local script; never expose it through a `NEXT_PUBLIC_` variable, commit it, or use it in web application code.
- For periodic refreshes, schedule `npm.cmd run embeddings:update -- --refresh` in Windows Task Scheduler with the repository as the working directory. Choose a cadence appropriate for catalogue edits and local compute time. This recomputes the full catalogue each run; the missing-only command does not detect non-null embeddings whose source fields changed.
- Use a pgvector index appropriate for the deployed distance operator and catalogue size if query plans show it is needed. Validate the actual RPC query plan and index behavior rather than assuming an index is used.

## Missing Embeddings, Empty Results, and Errors

- If the target stamp has no embedding, the RPC returns zero rows and the Related Stamps card is omitted. Do not substitute unrelated newest stamps; that would present non-semantic recommendations as related.
- Candidates with null embeddings are excluded. Until backfill completes, some stamps therefore cannot appear as recommendations.
- Zero rows is a valid empty result, not an error.
- If the RPC returns an error, surface it through the existing stamp-page error handling. Do not silently convert an RPC failure into an empty list or fall back to the legacy/latest-stamps query.
- Confirm the RPC returns an empty result rather than an error for a nonexistent or unembedded `target_id`; the stamp page should still independently handle a missing stamp.

## Application Types and Display

The RPC result includes `similarity`, represented by `StampRelatedItem`. Keep the other list-item types used for previous/next navigation unchanged.

The existing Related Stamps card currently displays the image, issue date, name, and denomination, but not the similarity score or description. Keep the similarity in the data for ranking/diagnostics; do not display a numeric score unless the UI requirement changes.

Request up to six results in `getRelatedStamps`; the card uses `relatedStamps.slice(0, 6)`, so it displays at most six in two rows of three. If changing the visible count, update both the request limit and the card slice deliberately.

## Implementation and Verification Workflow

1. Apply the migration and verify the deployed `embedding` dimension, vector extension schema, RPC signature/return schema, permissions, and RLS behavior.
2. Add the service-role key to local environment configuration, then run the missing-only updater to backfill null embeddings. Use `--refresh` to regenerate all rows after changing source data or the model/input format.
3. Verify behavior for an embedded target, target with a null embedding, incomplete candidate embeddings, no other embedded stamps, an RPC permission/schema error, and a missing stamp.
4. Confirm RPC errors propagate through `getStampDetails` to the page error boundary; a successful zero-row response alone should omit the card.
5. Inspect real matches for semantic relevance and query performance. If adding a similarity threshold, index, or fallback, document and test the behavior.
