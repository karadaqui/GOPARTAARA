-- Allow public token-based verification (no login needed)
CREATE POLICY "Public can verify deletion by token"
ON public.deletion_requests
FOR SELECT
USING (true);

-- Allow public token-based confirmation (no login needed)
CREATE POLICY "Public can confirm deletion by token"
ON public.deletion_requests
FOR UPDATE
USING (confirmed = false AND expires_at > now())
WITH CHECK (confirmed = true);