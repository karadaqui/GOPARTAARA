
-- Add trial_ends_at column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Update handle_new_user to auto-assign Pro trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, referral_code, subscription_plan, subscription_period, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8),
    'pro',
    'trial',
    now() + interval '30 days'
  );
  RETURN NEW;
END;
$$;
