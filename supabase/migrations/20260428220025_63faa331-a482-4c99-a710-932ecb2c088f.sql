-- 1. Add payout tracking columns to offers table
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS payout_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_date timestamp with time zone;

-- 2. Create seller_payout_info table
CREATE TABLE IF NOT EXISTS public.seller_payout_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  sort_code text,
  account_number text,
  paypal_email text,
  preferred_method text NOT NULL DEFAULT 'bank',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_payout_info ENABLE ROW LEVEL SECURITY;

-- Sellers manage their own payout info
CREATE POLICY "Users can view own payout info"
  ON public.seller_payout_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payout info"
  ON public.seller_payout_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payout info"
  ON public.seller_payout_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all payout info
CREATE POLICY "Admin can view all payout info"
  ON public.seller_payout_info FOR SELECT
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

-- Service role full access
CREATE POLICY "Service role can manage payout info"
  ON public.seller_payout_info FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER update_seller_payout_info_updated_at
  BEFORE UPDATE ON public.seller_payout_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();