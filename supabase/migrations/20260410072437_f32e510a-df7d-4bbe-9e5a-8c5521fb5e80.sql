
-- Add admin note column to listing_reviews
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS dispute_admin_note text;

-- Allow admin to read all profiles (needed for enriching dispute views)
CREATE POLICY "Admin can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);
