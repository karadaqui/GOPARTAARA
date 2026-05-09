
-- Add column to stash buyer's checkout address until Stripe webhook fires
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS pending_address jsonb;
