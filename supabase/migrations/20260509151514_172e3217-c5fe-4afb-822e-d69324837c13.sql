
-- 1) user_addresses table
CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text,
  street1 text NOT NULL,
  street2 text,
  city text NOT NULL,
  county text,
  postcode text NOT NULL,
  country text NOT NULL DEFAULT 'GB',
  is_default boolean NOT NULL DEFAULT false,
  is_billing boolean NOT NULL DEFAULT false,
  delivery_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON public.user_addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.user_addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.user_addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.user_addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access addresses" ON public.user_addresses
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);

CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) seller_profiles collection columns
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS offers_collection boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collection_address jsonb,
  ADD COLUMN IF NOT EXISTS collection_instructions text,
  ADD COLUMN IF NOT EXISTS collection_window text;

-- 3) orders extra columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS fulfillment_method text NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS is_new_account boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS billing_address jsonb,
  ADD COLUMN IF NOT EXISTS delivery_instructions text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number) WHERE order_number IS NOT NULL;
