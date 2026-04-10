
CREATE TABLE public.security_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  ip_address text,
  user_id uuid,
  function_name text,
  details jsonb,
  severity text NOT NULL DEFAULT 'info'
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage security logs"
  ON public.security_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admin can view security logs"
  ON public.security_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded');

CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_ip ON public.security_logs(ip_address);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);
