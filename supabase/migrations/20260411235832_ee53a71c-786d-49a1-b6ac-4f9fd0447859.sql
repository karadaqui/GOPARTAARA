-- 1. Restrict listing_reviews SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can read listing reviews" ON public.listing_reviews;
CREATE POLICY "Authenticated users can read listing reviews"
  ON public.listing_reviews FOR SELECT TO authenticated
  USING (true);

-- 2. Restrict part_reviews SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can read part reviews" ON public.part_reviews;
CREATE POLICY "Authenticated users can read part reviews"
  ON public.part_reviews FOR SELECT TO authenticated
  USING (true);