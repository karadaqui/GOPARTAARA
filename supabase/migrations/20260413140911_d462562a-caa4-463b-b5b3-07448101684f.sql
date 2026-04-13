
-- Add missing columns to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS read_time text;

-- Create blog_topics table for topic rotation tracking
CREATE TABLE IF NOT EXISTS public.blog_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic text NOT NULL UNIQUE,
  last_used timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage blog topics"
  ON public.blog_topics FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Anyone can read blog topics"
  ON public.blog_topics FOR SELECT
  USING (true);

-- Seed all 30 topics
INSERT INTO public.blog_topics (topic) VALUES
  ('Best ways to find cheap car parts in the UK'),
  ('OEM vs aftermarket car parts: which is better?'),
  ('How to find car parts using a photo'),
  ('BMW E46 common parts that fail and where to find them'),
  ('Ford Focus car parts guide UK 2026'),
  ('Vauxhall Astra parts — cheapest places to buy'),
  ('Toyota Corolla spare parts UK guide'),
  ('How to read a car parts number (OEM numbers explained)'),
  ('eBay car parts: tips for buying safely in the UK'),
  ('How MOT failures can save you money on parts'),
  ('Best UK websites to buy car parts online'),
  ('Brake pads and discs: how to find the right ones for your car'),
  ('Engine mounts: signs of failure and where to buy cheap'),
  ('Catalytic converter: why it''s expensive and how to find alternatives'),
  ('Car parts for classic vehicles: where to look in the UK'),
  ('How to use your reg plate to find the right car part'),
  ('Timing belt vs timing chain: what you need to know'),
  ('Suspension parts: coilovers, springs, dampers explained'),
  ('How to save money on car repairs using online parts'),
  ('Electric car parts: what''s different and where to buy'),
  ('Car parts for vans and commercial vehicles UK'),
  ('Headlights and bulbs: LED vs halogen vs xenon'),
  ('Winter car maintenance: parts you should check now'),
  ('How to check if a car part is compatible with your vehicle'),
  ('Second hand car parts: salvage yards and online marketplaces UK'),
  ('Car parts delivery UK: fastest and cheapest shipping options'),
  ('How PARTARA compares prices from multiple suppliers'),
  ('Air filters, oil filters, fuel filters: when to replace'),
  ('Clutch replacement cost UK: parts and what to expect'),
  ('Exhaust systems: symptoms of failure and replacement options')
ON CONFLICT (topic) DO NOTHING;
