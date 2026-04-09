CREATE POLICY "Admin can view all listings"
ON public.seller_listings
FOR SELECT
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

CREATE POLICY "Admin can update all listings"
ON public.seller_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);