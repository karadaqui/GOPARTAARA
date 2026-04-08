
-- Add referral_code and bonus_searches to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bonus_searches INTEGER NOT NULL DEFAULT 0;

-- Generate referral codes for existing users
UPDATE public.profiles
SET referral_code = SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8)
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can view their own referrals
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Service role can insert referrals
CREATE POLICY "Service role can insert referrals"
  ON public.referrals FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- Update handle_new_user to generate referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8)
  );
  RETURN NEW;
END;
$function$;

-- Function to process referral (called from edge function)
CREATE OR REPLACE FUNCTION public.process_referral(referrer_code TEXT, new_user_id UUID)
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find referrer
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = referrer_code;

  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = new_user_id THEN
    RETURN FALSE;
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = new_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, new_user_id);

  -- Award bonus searches to both
  UPDATE public.profiles SET bonus_searches = bonus_searches + 5 WHERE user_id = v_referrer_id;
  UPDATE public.profiles SET bonus_searches = bonus_searches + 5 WHERE user_id = new_user_id;

  RETURN TRUE;
END;
$function$;
