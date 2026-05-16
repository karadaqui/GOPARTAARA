
-- 1. seller_profiles: hide PII from anonymous (unauthenticated) users via column-level grants
REVOKE SELECT ON public.seller_profiles FROM anon;
GRANT SELECT (
  id, user_id, business_name, description, logo_url, seller_tier,
  ships_to, website_url, opening_hours, approved, created_at, updated_at,
  offers_collection, collection_address, collection_instructions, collection_window
) ON public.seller_profiles TO anon;

-- 2. listing_views: require viewer_id = auth.uid() (no NULL allowed)
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.listing_views;
CREATE POLICY "Authenticated users can insert views"
ON public.listing_views
FOR INSERT TO authenticated
WITH CHECK (viewer_id = auth.uid());

-- 3. profiles.seller_bank_details: drop the column (data lives in seller_payout_info)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS seller_bank_details;
