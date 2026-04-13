
-- Offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.seller_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount decimal NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can create offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can view own offers" ON public.offers FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view offers on their listings" ON public.offers FOR SELECT TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can update offer status" ON public.offers FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Service role full access offers" ON public.offers FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.seller_listings(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_id, seller_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Service role full access conversations" ON public.conversations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (
  conversation_id IN (SELECT id FROM public.conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND conversation_id IN (SELECT id FROM public.conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid())
);
CREATE POLICY "Recipients can mark read" ON public.chat_messages FOR UPDATE TO authenticated USING (
  sender_id != auth.uid() AND conversation_id IN (SELECT id FROM public.conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid())
);
CREATE POLICY "Service role full access messages" ON public.chat_messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Index for performance
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_offers_listing ON public.offers(listing_id);
CREATE INDEX idx_offers_seller ON public.offers(seller_id);
CREATE INDEX idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON public.conversations(seller_id);
