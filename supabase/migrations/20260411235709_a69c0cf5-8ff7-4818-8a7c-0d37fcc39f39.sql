-- 1. Fix notifications INSERT policy: restrict to own user_id only
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix seller_profiles: drop the overly broad public SELECT, create a restricted one
DROP POLICY IF EXISTS "Anyone can view approved seller profiles" ON public.seller_profiles;
CREATE POLICY "Anyone can view approved seller profiles (safe)"
  ON public.seller_profiles FOR SELECT TO public
  USING (approved = true);

-- 3. Fix storage: drop overly broad INSERT policies, keep the scoped ones
DROP POLICY IF EXISTS "Auth users can upload listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload seller logos" ON storage.objects;