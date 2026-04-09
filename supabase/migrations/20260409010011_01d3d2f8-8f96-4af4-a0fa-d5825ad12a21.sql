
-- Add approval_status to seller_listings
ALTER TABLE public.seller_listings 
ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';

-- Update existing active listings to approved so they remain visible
UPDATE public.seller_listings SET approval_status = 'approved' WHERE active = true;

-- Drop old public SELECT policy and replace with one that checks approval_status
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.seller_listings;

CREATE POLICY "Anyone can view approved active listings" 
ON public.seller_listings 
FOR SELECT 
TO public
USING (active = true AND approval_status = 'approved');

-- Service role can manage all listings (for admin panel)
CREATE POLICY "Service role can manage all listings"
ON public.seller_listings
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);
