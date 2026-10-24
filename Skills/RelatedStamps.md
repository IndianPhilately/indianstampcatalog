---
name: related-stamps
description: "Use when implementing or troubleshooting semantic related-stamp recommendations and local embedding updates."
---

# Related Stamps

The stamp detail page finds recommendations using Supabase pgvector embeddings and the `match_related_stamps` RPC. The application requests and displays up to six similar stamps in two rows of three.

The implementation and local embedding-update workflow are documented in [NewRelatedStamps.md](./NewRelatedStamps.md). The RPC definition is in [the Supabase migration](../supabase/migrations/20261024120000_match_related_stamps.sql), and the local updater is [scripts/generate-embeddings.ts](../scripts/generate-embeddings.ts).
