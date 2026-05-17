
-- 1. seller_profiles: restrict anon to safe columns only; authenticated keeps full access
DROP POLICY IF EXISTS "Public can view approved seller profiles" ON public.seller_profiles;

CREATE POLICY "Anon can view approved seller profiles"
  ON public.seller_profiles FOR SELECT TO anon
  USING (approved = true);

CREATE POLICY "Authenticated can view approved seller profiles"
  ON public.seller_profiles FOR SELECT TO authenticated
  USING (approved = true);

REVOKE SELECT ON public.seller_profiles FROM anon;
GRANT SELECT (
  id, user_id, business_name, description, logo_url, seller_tier,
  ships_to, website_url, opening_hours, collection_address,
  collection_instructions, collection_window, approved, created_at, updated_at
) ON public.seller_profiles TO anon;

-- 2. seller_applications: add admin SELECT policy
CREATE POLICY "Admin can view seller applications"
  ON public.seller_applications FOR SELECT TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

CREATE POLICY "Admin can update seller applications"
  ON public.seller_applications FOR UPDATE TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
  WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- 3. listing_reviews: restrict reads to approved listings only; owners still see their own
DROP POLICY IF EXISTS "Authenticated users can read listing reviews" ON public.listing_reviews;

CREATE POLICY "Users can read reviews on approved listings"
  ON public.listing_reviews FOR SELECT TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM public.seller_listings
      WHERE active = true AND approval_status = 'approved'
    )
    OR auth.uid() = user_id
    OR auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid
  );
