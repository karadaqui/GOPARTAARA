
-- 1. Restrict seller contact details from anonymous users
REVOKE SELECT ON public.seller_profiles FROM anon;
GRANT SELECT (id, business_name, description, logo_url, website_url, seller_tier, approved, created_at, updated_at, user_id) ON public.seller_profiles TO anon;
GRANT SELECT ON public.seller_profiles TO authenticated;

-- 2. Fix listing_views INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.listing_views;
CREATE POLICY "Authenticated users can insert views"
  ON public.listing_views
  FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid() OR viewer_id IS NULL);
