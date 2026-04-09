CREATE POLICY "Admin can update all seller profiles"
ON public.seller_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);