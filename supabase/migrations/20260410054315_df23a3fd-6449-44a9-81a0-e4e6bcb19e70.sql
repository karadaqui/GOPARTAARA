CREATE OR REPLACE FUNCTION public.is_email_confirmed(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(p_email)
      AND email_confirmed_at IS NOT NULL
  );
$$;