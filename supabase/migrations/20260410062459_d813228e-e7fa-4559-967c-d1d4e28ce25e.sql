
-- Price history table for 30-day price tracking
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  price numeric NOT NULL,
  checked_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_item_id ON public.price_history (item_id);
CREATE INDEX idx_price_history_checked_at ON public.price_history (checked_at);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read price history"
ON public.price_history FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Service role can manage price history"
ON public.price_history FOR ALL TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Vehicle notes table for service history
CREATE TABLE public.vehicle_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note text NOT NULL,
  noted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_notes_vehicle_id ON public.vehicle_notes (vehicle_id);

ALTER TABLE public.vehicle_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicle notes"
ON public.vehicle_notes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicle notes"
ON public.vehicle_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicle notes"
ON public.vehicle_notes FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicle notes"
ON public.vehicle_notes FOR DELETE TO authenticated
USING (auth.uid() = user_id);
