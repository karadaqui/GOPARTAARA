
-- Create listing_disputes table
CREATE TABLE public.listing_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.seller_listings(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.listing_reviews(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL,
  seller_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.listing_disputes ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on disputes
CREATE POLICY "Admin can manage all disputes"
  ON public.listing_disputes FOR ALL
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
  WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Service role can manage disputes
CREATE POLICY "Service role can manage disputes"
  ON public.listing_disputes FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Sellers can view their own disputes
CREATE POLICY "Sellers can view own disputes"
  ON public.listing_disputes FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Sellers can create disputes
CREATE POLICY "Sellers can create disputes"
  ON public.listing_disputes FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Admin can delete any blog post (currently only hardcoded UUID)
-- Already exists for one admin UUID, but let's ensure full admin delete
CREATE POLICY "Admin can manage all blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
  WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Admin can delete any seller listing
CREATE POLICY "Admin can delete any listing"
  ON public.seller_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Service role manage listing_reviews (for edge function cleanup)
CREATE POLICY "Service role can manage reviews"
  ON public.listing_reviews FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Add resolved column to contact_messages
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;

-- Admin can update contact messages (mark resolved)
CREATE POLICY "Admin can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
  WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Admin can delete contact messages
CREATE POLICY "Admin can delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);
