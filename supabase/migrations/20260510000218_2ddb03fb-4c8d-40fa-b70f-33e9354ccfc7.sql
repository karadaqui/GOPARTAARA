ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS collection_contact_name text,
  ADD COLUMN IF NOT EXISTS collection_contact_phone text;