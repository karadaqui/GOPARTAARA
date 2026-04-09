
-- Remove duplicate listing_views, keeping only the earliest per (listing_id, viewer_id)
DELETE FROM public.listing_views a
USING public.listing_views b
WHERE a.listing_id = b.listing_id
  AND a.viewer_id = b.viewer_id
  AND a.viewer_id IS NOT NULL
  AND a.created_at > b.created_at;

-- Now create the dedup index
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_views_dedup 
  ON public.listing_views (listing_id, viewer_id) 
  WHERE viewer_id IS NOT NULL;
