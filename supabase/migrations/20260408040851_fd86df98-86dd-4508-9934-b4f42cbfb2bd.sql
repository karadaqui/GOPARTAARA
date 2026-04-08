
-- Part reviews table
CREATE TABLE public.part_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  part_query TEXT NOT NULL,
  supplier TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one review per user per part+supplier combo
CREATE UNIQUE INDEX idx_part_reviews_unique ON public.part_reviews (user_id, part_query, supplier);

ALTER TABLE public.part_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.part_reviews FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.part_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.part_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.part_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seller applications table
CREATE TABLE public.seller_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  business_address TEXT,
  parts_description TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" ON public.seller_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can submit applications" ON public.seller_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Service role can manage applications" ON public.seller_applications FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
