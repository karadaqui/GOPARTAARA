CREATE TABLE public.search_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month_year text NOT NULL,
  search_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_year)
);

CREATE INDEX idx_search_usage_user_month ON public.search_usage(user_id, month_year);

ALTER TABLE public.search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search usage"
  ON public.search_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage search usage"
  ON public.search_usage
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_search_usage_updated_at
  BEFORE UPDATE ON public.search_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();