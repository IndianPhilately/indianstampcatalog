CREATE OR REPLACE FUNCTION public.match_related_stamps(
  target_id uuid,
  match_count integer DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  name text,
  theme text,
  description text,
  issue_date date,
  denomination text,
  image_url text,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public, extensions
AS $$
  WITH target AS (
    SELECT stamp.embedding
    FROM public.stamps AS stamp
    WHERE stamp.id = target_id
      AND stamp.embedding IS NOT NULL
  )
  SELECT
    candidate.id,
    candidate.name,
    candidate.theme,
    candidate.description,
    candidate.issue_date,
    candidate.denomination,
    candidate.image_url,
    (1 - (
      candidate.embedding OPERATOR(extensions.<=>) target.embedding
    ))::double precision AS similarity
  FROM public.stamps AS candidate
  CROSS JOIN target
  WHERE candidate.id <> target_id
    AND candidate.embedding IS NOT NULL
  ORDER BY
    candidate.embedding OPERATOR(extensions.<=>) target.embedding ASC,
    candidate.id ASC
  LIMIT LEAST(GREATEST(COALESCE(match_count, 6), 0), 6);
$$;

REVOKE ALL ON FUNCTION public.match_related_stamps(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_related_stamps(uuid, integer) TO anon, authenticated;
