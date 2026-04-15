
-- Create saved_folders table
CREATE TABLE IF NOT EXISTS public.saved_folders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'zinc',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_folders
CREATE POLICY "Users can view own folders"
  ON public.saved_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON public.saved_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.saved_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.saved_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Add folder_id and currency to saved_parts
ALTER TABLE public.saved_parts
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.saved_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'GBP';
