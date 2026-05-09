import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OfferChatModalProps {
  open: boolean;
  onClose: () => void;
  offer: {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    listing_title?: string | null;
    photo?: string | null;
  };
}

interface Msg {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export const SYSTEM_PREFIX = "[[SYS]] ";

const OfferChatModal = ({ open, onClose, offer }: OfferChatModalProps) => {
  const { user } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  const ensureConversation = useCallback(async () => {
    setLoading(true);
    try {
      // Find existing conversation by offer_id
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("offer_id" as any, offer.id)
        .maybeSingle();
      if (existing?.id) { setConvId(existing.id); return existing.id; }

      // Fallback by listing+buyer+seller
      const { data: alt } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", offer.listing_id)
        .eq("buyer_id", offer.buyer_id)
        .eq("seller_id", offer.seller_id)
        .maybeSingle();
      if (alt?.id) {
        await supabase.from("conversations").update({ offer_id: offer.id } as any).eq("id", alt.id);
        setConvId(alt.id);
        return alt.id;
      }

      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: offer.listing_id,
          buyer_id: offer.buyer_id,
          seller_id: offer.seller_id,
          offer_id: offer.id,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      setConvId(created.id);
      return created.id;
    } finally {
      setLoading(false);
    }
  }, [offer.id, offer.listing_id, offer.buyer_id, offer.seller_id]);

  const loadMessages = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    setMessages((data as any) || []);
    // mark as read for incoming
    if (user) {
      try {
        await supabase
          .from("chat_messages")
          .update({ read: true })
          .eq("conversation_id", cid)
          .neq("sender_id", user.id)
          .eq("read", false);
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const cid = await ensureConversation();
      if (cancelled || !cid) return;
      await loadMessages(cid);
      pollRef.current = window.setInterval(() => loadMessages(cid), 10000);
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [open, ensureConversation, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!user || !convId || !text.trim()) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      content,
    });
    if (error) {
      toast.error("Failed to send message");
    } else {
      await loadMessages(convId);
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-display text-base">Offer chat</DialogTitle>
        </DialogHeader>

        {/* Offer summary */}
        <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
          {offer.photo ? (
            <img src={offer.photo} alt="" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-xl">🔧</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{offer.listing_title || "Listing"}</p>
            <p className="text-xs text-muted-foreground">Offer: <span className="font-bold text-primary">£{Number(offer.amount).toFixed(2)}</span></p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[45vh]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet — start the conversation.</p>
          ) : messages.map(m => {
            const isSystem = m.content.startsWith(SYSTEM_PREFIX);
            const isMine = user && m.sender_id === user.id;
            if (isSystem) {
              return (
                <div key={m.id} className="text-center">
                  <span className="inline-block text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">
                    {m.content.replace(SYSTEM_PREFIX, "")}
                  </span>
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMine && (m.read ? " · Read" : " · Sent")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message…"
            className="rounded-xl"
          />
          <Button onClick={sendMessage} disabled={sending || !text.trim()} className="rounded-xl gap-1.5">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferChatModal;

/** Helper to insert a system message tied to a conversation. */
export async function insertSystemMessage(conversationId: string, senderId: string, text: string) {
  try {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: SYSTEM_PREFIX + text,
    });
  } catch {}
}

/** Ensure a conversation exists for an offer, returning its id. */
export async function ensureOfferConversation(offer: { id: string; listing_id: string; buyer_id: string; seller_id: string; }): Promise<string | null> {
  try {
    const sb = supabase as any;
    const { data: existing } = await sb
      .from("conversations")
      .select("id")
      .eq("offer_id", offer.id)
      .maybeSingle();
    if (existing?.id) return existing.id as string;

    const { data: alt } = await sb
      .from("conversations")
      .select("id")
      .eq("listing_id", offer.listing_id)
      .eq("buyer_id", offer.buyer_id)
      .eq("seller_id", offer.seller_id)
      .maybeSingle();
    if (alt?.id) {
      await sb.from("conversations").update({ offer_id: offer.id }).eq("id", alt.id);
      return alt.id as string;
    }

    const { data: created } = await sb
      .from("conversations")
      .insert({
        listing_id: offer.listing_id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        offer_id: offer.id,
      })
      .select("id")
      .single();
    return (created?.id as string) || null;
  } catch {
    return null;
  }
}
