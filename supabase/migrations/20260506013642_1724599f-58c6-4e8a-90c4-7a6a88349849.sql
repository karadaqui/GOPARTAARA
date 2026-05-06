CREATE TABLE public.parts_cache (
  id text PRIMARY KEY,
  name text NOT NULL,
  price text,
  brand text,
  category text,
  image_url text,
  url text,
  supplier text,
  advertiser_id text,
  in_stock boolean DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parts cache"
ON public.parts_cache FOR SELECT
USING (true);

CREATE POLICY "Service role can manage parts cache"
ON public.parts_cache FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_parts_cache_name ON public.parts_cache USING gin (to_tsvector('english', name));
CREATE INDEX idx_parts_cache_brand ON public.parts_cache (brand);
CREATE INDEX idx_parts_cache_category ON public.parts_cache (category);