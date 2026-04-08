
CREATE TABLE public.user_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nickname TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  engine_size TEXT,
  registration_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles" ON public.user_vehicles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles" ON public.user_vehicles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" ON public.user_vehicles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" ON public.user_vehicles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
