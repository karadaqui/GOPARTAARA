import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageSquare, ArrowLeft, Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";

interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing_title?: string;
  other_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();

    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playTone(880, now, 0.3, 0.15);
    playTone(1100, now + 0.15, 0.4, 0.1);
  } catch {}
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('partara_sound_enabled');
    return stored === null ? true : stored === 'true';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvRef = useRef<string | null>(selectedConv);

  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('partara_sound_enabled', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
      markAsRead(selectedConv);
    }
  }, [selectedConv]);

  // Realtime subscription for current conversation
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`chat-${selectedConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${selectedConv}`,
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages(prev => [...prev, msg]);
        if (msg.sender_id !== user?.id) {
          markAsRead(selectedConv);
          if (soundEnabled) playNotificationSound();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user?.id, soundEnabled]);

  // Realtime subscription for ALL conversations (for sound on non-selected convos)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`all-messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.sender_id !== user.id && msg.conversation_id !== selectedConvRef.current) {
          if (soundEnabled) playNotificationSound();
          // Update unread count in conversation list
          setConversations(prev => prev.map(c =>
            c.id === msg.conversation_id
              ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: msg.content, last_message_at: msg.created_at }
              : c
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, soundEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!convs || convs.length === 0) { setConversations([]); setLoading(false); return; }

    const otherUserIds = [...new Set(convs.map(c => c.buyer_id === user.id ? c.seller_id : c.buyer_id))];
    const listingIds = [...new Set(convs.map(c => c.listing_id).filter(Boolean))] as string[];

    const [profilesRes, listingsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").in("user_id", otherUserIds),
      listingIds.length > 0
        ? supabase.from("seller_listings").select("id, title").in("id", listingIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.display_name]));
    const listingMap = new Map((listingsRes.data || []).map(l => [l.id, l.title]));

    const enriched: Conversation[] = [];
    for (const c of convs) {
      const { data: lastMsg } = await supabase
        .from("chat_messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("read", false)
        .neq("sender_id", user.id);

      enriched.push({
        ...c,
        listing_title: c.listing_id ? listingMap.get(c.listing_id) || "Listing" : undefined,
        other_name: profileMap.get(c.buyer_id === user.id ? c.seller_id : c.buyer_id) || "User",
        last_message: lastMsg?.content,
        last_message_at: lastMsg?.created_at,
        unread_count: count || 0,
      });
    }

    enriched.sort((a, b) => {
      const aTime = a.last_message_at || a.created_at;
      const bTime = b.last_message_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(enriched);

    if (initialConvId && convs.find(c => c.id === initialConvId)) {
      setSelectedConv(initialConvId);
    }

    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const markAsRead = async (convId: string) => {
    if (!user) return;
    await supabase
      .from("chat_messages")
      .update({ read: true })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .eq("read", false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || !user) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (!error) setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConv);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Messages — PARTARA" description="Your marketplace messages" />
      <Navbar />
      <div className="container max-w-5xl flex-1 py-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className="rounded-xl text-muted-foreground hover:text-foreground"
            title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
          >
            {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : conversations.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <MessageSquare size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-4">Start a conversation by messaging a seller on the marketplace.</p>
            <Button onClick={() => navigate("/marketplace")} className="rounded-xl">Browse Marketplace</Button>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-border/40" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
            <div className="flex h-full">
              {/* Conversation list */}
              <div className={`w-full md:w-80 border-r border-border/40 flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
                <div className="p-3 border-b border-border/40">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversations</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv.id)}
                      className={`w-full p-3 text-left border-b border-border/20 transition-colors hover:bg-accent/5 ${
                        selectedConv === conv.id ? "bg-accent/10" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate">{conv.other_name}</span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                        )}
                      </div>
                      {conv.listing_title && (
                        <p className="text-[11px] text-primary truncate mb-0.5">Re: {conv.listing_title}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message || "No messages yet"}</p>
                        {(conv.unread_count || 0) > 0 && (
                          <Badge className="ml-2 h-5 min-w-[20px] text-[10px] shrink-0">{conv.unread_count}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat area */}
              <div className={`flex-1 flex flex-col ${!selectedConv ? "hidden md:flex" : "flex"}`}>
                {selectedConv && selectedConversation ? (
                  <>
                    <div className="p-3 border-b border-border/40 flex items-center gap-3">
                      <button onClick={() => setSelectedConv(null)} className="md:hidden text-muted-foreground">
                        <ArrowLeft size={18} />
                      </button>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{selectedConversation.other_name}</p>
                        {selectedConversation.listing_title && (
                          <p className="text-[11px] text-muted-foreground truncate">Re: {selectedConversation.listing_title}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            msg.sender_id === user.id
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary text-secondary-foreground rounded-bl-md"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${
                              msg.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-border/40">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message..."
                          className="rounded-xl bg-secondary border-border"
                        />
                        <Button
                          onClick={handleSend}
                          disabled={!newMessage.trim() || sending}
                          size="icon"
                          className="rounded-xl shrink-0"
                        >
                          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <MessageSquare size={40} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Messages;
