-- Fix: listing_views INSERT policy - require authentication
DROP POLICY IF EXISTS "Anyone can insert views" ON public.listing_views;
CREATE POLICY "Authenticated users can insert views"
ON public.listing_views
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix: seller_applications INSERT policy - require authentication  
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.seller_applications;
CREATE POLICY "Authenticated users can submit applications"
ON public.seller_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix: Storage listing-photos ownership checks
DROP POLICY IF EXISTS "Anyone can view listing photos" ON storage.objects;
CREATE POLICY "Anyone can view listing photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

DROP POLICY IF EXISTS "Sellers can upload listing photos" ON storage.objects;
CREATE POLICY "Sellers can upload listing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sellers can update own listing photos" ON storage.objects;
CREATE POLICY "Sellers can update own listing photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sellers can delete own listing photos" ON storage.objects;
CREATE POLICY "Sellers can delete own listing photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix: Storage seller-logos ownership checks
DROP POLICY IF EXISTS "Anyone can view seller logos" ON storage.objects;
CREATE POLICY "Anyone can view seller logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-logos');

DROP POLICY IF EXISTS "Sellers can upload logos" ON storage.objects;
CREATE POLICY "Sellers can upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seller-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sellers can update own logos" ON storage.objects;
CREATE POLICY "Sellers can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seller-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sellers can delete own logos" ON storage.objects;
CREATE POLICY "Sellers can delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'seller-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  function_name text NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, function_name, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(user_id, function_name, window_start);

-- Auto-cleanup old rate limit entries (older than 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '2 hours';
END;
$$;