CREATE TABLE IF NOT EXISTS public.tyre_products_cache (
  id BIGSERIAL PRIMARY KEY,
  feed_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC,
  currency TEXT DEFAULT '£',
  url TEXT NOT NULL,
  brand TEXT,
  width TEXT,
  profile TEXT,
  rim TEXT,
  tyre_size TEXT,
  raw_data JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tyre_size ON public.tyre_products_cache(tyre_size);
CREATE INDEX IF NOT EXISTS idx_cached_at ON public.tyre_products_cache(cached_at);

ALTER TABLE public.tyre_products_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.tyre_products_cache FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON public.tyre_products_cache FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');