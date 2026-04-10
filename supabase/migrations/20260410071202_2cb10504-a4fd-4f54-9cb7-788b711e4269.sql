CREATE POLICY "Admin can delete any review"
ON public.listing_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);