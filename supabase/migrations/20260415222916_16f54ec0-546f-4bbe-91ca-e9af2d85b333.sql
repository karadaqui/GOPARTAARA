
CREATE OR REPLACE FUNCTION public.process_referral(referrer_code text, new_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_trial timestamptz;
  v_referrer_period text;
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

  -- Give referred user 1 month Pro trial
  UPDATE public.profiles SET
    subscription_plan = 'pro',
    subscription_period = 'trial',
    trial_ends_at = now() + interval '30 days'
  WHERE user_id = new_user_id;

  -- Give referrer 1 month Pro extension
  SELECT trial_ends_at, subscription_period INTO v_referrer_trial, v_referrer_period
  FROM public.profiles WHERE user_id = v_referrer_id;

  UPDATE public.profiles SET
    subscription_plan = 'pro',
    subscription_period = CASE WHEN v_referrer_period = 'free' THEN 'trial' ELSE v_referrer_period END,
    trial_ends_at = GREATEST(COALESCE(v_referrer_trial, now()), now()) + interval '30 days'
  WHERE user_id = v_referrer_id;

  RETURN TRUE;
END;
$$;
