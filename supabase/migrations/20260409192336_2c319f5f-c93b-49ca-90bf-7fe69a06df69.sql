ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS ebay_item_id text,
  ADD COLUMN IF NOT EXISTS triggered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS triggered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS current_price numeric;