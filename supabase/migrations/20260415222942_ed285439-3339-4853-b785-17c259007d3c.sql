
-- Admin can update all profiles (to change subscription plans)
CREATE POLICY "Admin can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Admin can manage all notifications
CREATE POLICY "Admin can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Admin can delete any part review
CREATE POLICY "Admin can delete any part review"
ON public.part_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Admin can manage all offers
CREATE POLICY "Admin can manage all offers"
ON public.offers
FOR ALL
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);
