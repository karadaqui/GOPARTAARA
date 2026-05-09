
ALTER TABLE public.seller_listings
  ADD COLUMN IF NOT EXISTS shipping_fee numeric,
  ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dispatch_time text;

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_company text,
  ADD COLUMN IF NOT EXISTS sender_street1 text,
  ADD COLUMN IF NOT EXISTS sender_street2 text,
  ADD COLUMN IF NOT EXISTS sender_city text,
  ADD COLUMN IF NOT EXISTS sender_state text,
  ADD COLUMN IF NOT EXISTS sender_zip text,
  ADD COLUMN IF NOT EXISTS sender_country text DEFAULT 'GB',
  ADD COLUMN IF NOT EXISTS sender_phone text;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  offer_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'awaiting_shipment',
  buyer_name text,
  buyer_email text,
  shipping_address jsonb,
  tracking_number text,
  carrier text,
  label_url text,
  shippo_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Buyers can update own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admin can manage all orders" ON public.orders
  FOR ALL TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid)
  WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

CREATE POLICY "Service role manages orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id, created_at DESC);
