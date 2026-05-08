ALTER TABLE public.seller_profiles
ADD COLUMN IF NOT EXISTS ships_to text[] NOT NULL DEFAULT '{UK}';

CREATE INDEX IF NOT EXISTS idx_seller_ships_to
ON public.seller_profiles USING GIN(ships_to);