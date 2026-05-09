
-- 1) Add admin_approved flag to seller_listings
ALTER TABLE public.seller_listings ADD COLUMN IF NOT EXISTS admin_approved boolean NOT NULL DEFAULT false;

-- 2) Add offer_id + last_message_at to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS offer_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_conversations_offer_id ON public.conversations(offer_id);

-- 3) Recently viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recently viewed"
  ON public.recently_viewed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recently viewed"
  ON public.recently_viewed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recently viewed"
  ON public.recently_viewed FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recently viewed"
  ON public.recently_viewed FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_viewed ON public.recently_viewed(user_id, viewed_at DESC);

-- Trigger to keep only last 10 per user
CREATE OR REPLACE FUNCTION public.trim_recently_viewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.recently_viewed
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.recently_viewed
      WHERE user_id = NEW.user_id
      ORDER BY viewed_at DESC
      LIMIT 10
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trim_recently_viewed ON public.recently_viewed;
CREATE TRIGGER trg_trim_recently_viewed
AFTER INSERT OR UPDATE ON public.recently_viewed
FOR EACH ROW EXECUTE FUNCTION public.trim_recently_viewed();
