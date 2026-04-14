ALTER TABLE public.user_vehicles ADD COLUMN IF NOT EXISTS mot_expiry_date date;
ALTER TABLE public.user_vehicles ADD COLUMN IF NOT EXISTS tax_expiry_date date;