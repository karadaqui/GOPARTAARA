-- Add dispute columns to listing_reviews
ALTER TABLE public.listing_reviews
  ADD COLUMN dispute_status text NOT NULL DEFAULT 'none',
  ADD COLUMN dispute_reason text,
  ADD COLUMN dispute_date timestamptz;

-- Add index for admin dispute panel queries
CREATE INDEX idx_listing_reviews_dispute_status ON public.listing_reviews (dispute_status) WHERE dispute_status != 'none';