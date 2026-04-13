
-- Admin actions log table
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  listing_id UUID NULL,
  target_user_id UUID NULL,
  reason TEXT NULL,
  internal_notes TEXT NULL,
  listings_deleted_count INTEGER NULL DEFAULT 0,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view admin actions"
  ON public.admin_actions FOR SELECT
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

CREATE POLICY "Admin can insert admin actions"
  ON public.admin_actions FOR INSERT
  WITH CHECK (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);

CREATE POLICY "Service role can manage admin actions"
  ON public.admin_actions FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Deletion requests table (for shop deletion with email confirmation)
CREATE TABLE public.deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'shop',
  user_id UUID NOT NULL,
  reason TEXT NULL,
  feedback TEXT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own deletion requests"
  ON public.deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deletion requests"
  ON public.deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage deletion requests"
  ON public.deletion_requests FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX idx_deletion_requests_token ON public.deletion_requests (token);
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions (admin_id);
