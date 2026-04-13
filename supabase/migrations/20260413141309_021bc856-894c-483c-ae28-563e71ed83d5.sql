
ALTER TABLE public.seller_listings
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS boost_package text;
