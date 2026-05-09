import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ensureOfferConversation, insertSystemMessage } from "@/components/OfferChatModal";

interface OriginalOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  counter_count?: number | null;
  listing_title?: string | null;
  listing_photo?: string | null;
  buyer_email?: string | null;
  buyer_name?: string | null;
  seller_email?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  originalOffer: OriginalOffer;
  initiator: "seller" | "buyer";
  onSuccess?: () => void;
}

export default function CounterOfferModal({ open, onClose, originalOffer, initiator, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const oppositeLabel = initiator === "seller" ? "Buyer's offer" : "Seller's counter";

  const handleSubmit = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0 || value > 99999) {
      toast.error("Enter a valid amount between £0.01 and £99,999");
      return;
    }
    setSubmitting(true);
    try {
      const sb = supabase as any;
      const newCount = (originalOffer.counter_count || 0) + 1;

      const { data: newOffer, error } = await sb.from("offers").insert({
        listing_id: originalOffer.listing_id,
        buyer_id: originalOffer.buyer_id,
        seller_id: originalOffer.seller_id,
        amount: value,
        status: "pending",
        parent_offer_id: originalOffer.id,
        initiated_by: initiator,
        counter_count: newCount,
      }).select().single();
      if (error) throw error;

      await sb.from("offers").update({ status: "countered" }).eq("id", originalOffer.id);

      const actorLabel = initiator === "seller" ? "Seller" : "Buyer";

      try {
        const cid = await ensureOfferConversation({
          id: originalOffer.id,
          listing_id: originalOffer.listing_id,
          buyer_id: originalOffer.buyer_id,
          seller_id: originalOffer.seller_id,
        });
        const senderId = initiator === "seller" ? originalOffer.seller_id : originalOffer.buyer_id;
        if (cid) {
          await insertSystemMessage(
            cid,
            senderId,
            `💬 ${actorLabel} countered with £${value.toFixed(2)} on ${originalOffer.listing_title || "this part"}`
          );
        }
      } catch {}

      const recipientUserId = initiator === "seller" ? originalOffer.buyer_id : originalOffer.seller_id;
      try {
        await sb.from("notifications").insert({
          user_id: recipientUserId,
          type: "offer_countered",
          title: `${actorLabel} made a counter offer`,
          message: `${actorLabel === "Seller" ? "The seller" : "The buyer"} countered with £${value.toFixed(2)} on "${originalOffer.listing_title || "your offer"}". View and respond.`,
          link: initiator === "seller" ? "/marketplace" : "/my-market",
        });
      } catch {}

      const recipientEmail = initiator === "seller" ? originalOffer.buyer_email : originalOffer.seller_email;
      const recipientName = initiator === "seller" ? originalOffer.buyer_name : "Seller";
      if (recipientEmail) {
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "contact-notification",
              recipientEmail,
              idempotencyKey: `offer-counter-${newOffer.id}`,
              templateData: {
                name: recipientName || "there",
                email: recipientEmail,
                message: `💬 ${actorLabel === "Seller" ? "The seller" : "The buyer"} made a counter offer of £${value.toFixed(2)} on "${originalOffer.listing_title || "your offer"}". View and respond.`,
              },
            },
          });
        } catch {}
      }

      toast.success("Counter offer sent!");
      onSuccess?.();
      onClose();
      setAmount("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send counter offer");
    } finally {
      setSubmitting(false);
    }
  };

  const photoUrl = originalOffer.listing_photo
    ? originalOffer.listing_photo.startsWith("http")
      ? originalOffer.listing_photo
      : `https://bkwieknlxvkrzluongif.supabase.co/storage/v1/object/public/listing-photos/${originalOffer.listing_photo}`
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Counter Offer</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">🔧</div>
          )}
          <p className="font-semibold text-sm flex-1">{originalOffer.listing_title || "Listing"}</p>
        </div>

        <div className="text-sm text-muted-foreground">
          {oppositeLabel}: <span className="font-bold text-foreground">£{Number(originalOffer.amount).toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your counter offer (£)</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max="99999"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Round {(originalOffer.counter_count || 0) + 1} of 5 max
          </p>
        </div>

        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {submitting ? "Sending..." : "Send Counter Offer →"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
