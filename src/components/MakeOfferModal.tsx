import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MakeOfferModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerId: string; // user_id of seller
  currentPrice: number | null;
}

const MakeOfferModal = ({ open, onClose, listingId, listingTitle, sellerId, currentPrice }: MakeOfferModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState(currentPrice ? (currentPrice * 0.9).toFixed(2) : "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user) { navigate("/auth"); return; }
    const price = parseFloat(amount);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Enter a valid offer amount", variant: "destructive" });
      return;
    }
    setSending(true);

    const { error } = await supabase.from("offers").insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: sellerId,
      amount: price,
      message: message.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Send notification to seller
      await supabase.from("notifications").insert({
        user_id: sellerId,
        type: "offer",
        title: "New offer received 🤝",
        message: `New offer of £${price.toFixed(2)} on "${listingTitle}"`,
        link: "/my-market",
      });

      toast({ title: "Offer sent!", description: `Your offer of £${price.toFixed(2)} has been sent to the seller.` });
      onClose();
      setAmount("");
      setMessage("");
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Make an Offer 🤝</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send an offer to the seller for <span className="font-medium text-foreground">{listingTitle}</span>
            {currentPrice && <span> (listed at £{currentPrice.toFixed(2)})</span>}
          </p>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Your offer (£)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="rounded-xl bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Message (optional)</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a message to the seller..."
              className="rounded-xl bg-secondary border-border"
              rows={3}
            />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full rounded-xl gap-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : null}
            Send Offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
