CREATE POLICY "Admin can view all seller profiles"
ON public.seller_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);