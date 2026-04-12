-- Contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'General Enquiry',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Service role can read contact messages"
ON public.contact_messages
FOR SELECT
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Admin can read contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded');

-- Blog subscribers table
CREATE TABLE public.blog_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to blog"
ON public.blog_subscribers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Service role can read subscribers"
ON public.blog_subscribers
FOR SELECT
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Admin can read subscribers"
ON public.blog_subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded');