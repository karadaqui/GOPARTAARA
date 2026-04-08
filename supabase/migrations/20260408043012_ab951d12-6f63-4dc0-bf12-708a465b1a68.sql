
-- Seller profiles
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  website_url text,
  seller_tier text NOT NULL DEFAULT 'basic',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved sellers" ON public.seller_profiles
  FOR SELECT USING (approved = true);

CREATE POLICY "Sellers can view own profile" ON public.seller_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Sellers can insert own profile" ON public.seller_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile" ON public.seller_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seller listings
CREATE TABLE public.seller_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric,
  currency text NOT NULL DEFAULT 'GBP',
  category text,
  compatible_vehicles text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  external_link text,
  active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  save_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings" ON public.seller_listings
  FOR SELECT USING (active = true);

CREATE POLICY "Sellers can manage own listings" ON public.seller_listings
  FOR ALL TO authenticated
  USING (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));

-- Listing reviews
CREATE TABLE public.listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.seller_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listing reviews" ON public.listing_reviews
  FOR SELECT USING (true);

CREATE POLICY "Auth users can insert reviews" ON public.listing_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.listing_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.listing_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Listing saves (for tracking)
CREATE TABLE public.listing_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.seller_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

ALTER TABLE public.listing_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves" ON public.listing_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings" ON public.listing_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave listings" ON public.listing_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Listing views tracking
CREATE TABLE public.listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.seller_listings(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.listing_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sellers can read views on their listings" ON public.listing_views
  FOR SELECT TO authenticated
  USING (listing_id IN (
    SELECT sl.id FROM public.seller_listings sl
    JOIN public.seller_profiles sp ON sl.seller_id = sp.id
    WHERE sp.user_id = auth.uid()
  ));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('seller-logos', 'seller-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true);

-- Storage policies for seller logos
CREATE POLICY "Anyone can view seller logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'seller-logos');

CREATE POLICY "Auth users can upload seller logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'seller-logos');

CREATE POLICY "Users can update own seller logos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'seller-logos');

CREATE POLICY "Users can delete own seller logos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'seller-logos');

-- Storage policies for listing photos
CREATE POLICY "Anyone can view listing photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');

CREATE POLICY "Auth users can upload listing photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-photos');

CREATE POLICY "Users can update own listing photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'listing-photos');

CREATE POLICY "Users can delete own listing photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'listing-photos');

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing_id uuid, p_viewer_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.listing_views (listing_id, viewer_id) VALUES (p_listing_id, p_viewer_id);
  UPDATE public.seller_listings SET view_count = view_count + 1 WHERE id = p_listing_id;
END;
$$;
