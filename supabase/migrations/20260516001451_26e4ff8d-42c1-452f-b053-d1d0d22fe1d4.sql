
-- 1. seller_profiles: restrict anonymous access to safe columns only via column grants
DROP POLICY IF EXISTS "Anyone can view approved seller profiles (safe)" ON public.seller_profiles;
DROP POLICY IF EXISTS "Anyone can view approved sellers" ON public.seller_profiles;

-- Public (anon + authenticated) can SELECT approved seller profile rows; column grants restrict what anon can read
CREATE POLICY "Public can view approved seller profiles"
ON public.seller_profiles
FOR SELECT
TO anon, authenticated
USING (approved = true);

-- Reset grants
REVOKE ALL ON public.seller_profiles FROM anon, authenticated;

-- Anonymous users: only safe, non-PII columns
GRANT SELECT (
  id,
  user_id,
  business_name,
  description,
  logo_url,
  seller_tier,
  ships_to,
  website_url,
  opening_hours,
  collection_address,
  collection_instructions,
  collection_window,
  approved,
  created_at,
  updated_at
) ON public.seller_profiles TO anon;

-- Authenticated users: full row access (RLS still gates which rows)
GRANT SELECT, INSERT, UPDATE ON public.seller_profiles TO authenticated;

-- 2. listing_views: explicitly reject NULL viewer_id
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.listing_views;
CREATE POLICY "Authenticated users can insert views"
ON public.listing_views
FOR INSERT
TO authenticated
WITH CHECK (viewer_id IS NOT NULL AND viewer_id = auth.uid());
