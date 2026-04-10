
CREATE TABLE public.blog_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog generations"
  ON public.blog_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog generations"
  ON public.blog_generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage blog generations"
  ON public.blog_generations FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_blog_generations_user_date ON public.blog_generations (user_id, created_at);
