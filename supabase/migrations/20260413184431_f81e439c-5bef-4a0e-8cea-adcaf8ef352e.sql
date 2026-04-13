
ALTER TABLE public.listing_disputes ADD COLUMN IF NOT EXISTS listing_title TEXT;
ALTER TABLE public.listing_disputes ADD COLUMN IF NOT EXISTS review_text TEXT;
