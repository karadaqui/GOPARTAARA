
-- Revoke UPDATE on subscription_plan from authenticated role, grant UPDATE only on safe columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, email) ON public.profiles TO authenticated;
