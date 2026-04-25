-- Add alert_id and user_id columns to existing price_history table
ALTER TABLE public.price_history
  ADD COLUMN IF NOT EXISTS alert_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Index for fast per-alert lookups
CREATE INDEX IF NOT EXISTS idx_price_history_alert_checked
  ON public.price_history (alert_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_user
  ON public.price_history (user_id);

-- Add RLS policy so users can read their own alert price history
DROP POLICY IF EXISTS "Users can read their own price history" ON public.price_history;
CREATE POLICY "Users can read their own price history"
  ON public.price_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);