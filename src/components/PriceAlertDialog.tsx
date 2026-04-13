import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PriceAlertDialogProps {
  supplierName: string;
  partQuery: string;
  supplierUrl: string;
  ebayItemId?: string;
  currentPrice?: number;
}

const PriceAlertDialog = ({ supplierName, partQuery, supplierUrl, ebayItemId, currentPrice }: PriceAlertDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const userPlan = useUserPlan();
  const [targetPrice, setTargetPrice] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to set price alerts.",
        variant: "destructive",
      });
      return;
    }
    if (isOpen && !userPlan.features.priceAlerts) {
      toast({
        title: "Upgrade Required",
        description: "Price alerts require Pro or Elite plan.",
        variant: "destructive",
      });
      return;
    }
    setOpen(isOpen);
    if (isOpen) {
      setEmail(user?.email || "");
      setTargetPrice(currentPrice ? (currentPrice * 0.9).toFixed(2) : "");
    }
  };
    if (isOpen) {
      setEmail(user?.email || "");
      setTargetPrice(currentPrice ? (currentPrice * 0.9).toFixed(2) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Invalid price", description: "Enter a valid target price.", variant: "destructive" });
      return;
    }
    if (currentPrice && price >= currentPrice) {
      toast({ title: "Target too high", description: `Your target price must be lower than the current price of £${currentPrice.toFixed(2)}. Set a lower target to get notified when the price drops.`, variant: "destructive" });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id,
      part_name: partQuery,
      supplier: supplierName,
      target_price: price,
      email: email.trim(),
      url: supplierUrl,
      ebay_item_id: ebayItemId || null,
      current_price: currentPrice || null,
    } as any);
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Price alert set!", description: `We'll email you when this part drops below £${price.toFixed(2)}.` });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl border border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shrink-0"
          title="Set price alert"
          onClick={(e) => e.stopPropagation()}
        >
          <Bell size={10} className="sm:w-[14px] sm:h-[14px] text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Set Price Alert
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Part</label>
            <Input value={partQuery} disabled className="bg-secondary/50 border-border rounded-xl opacity-70" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Supplier</label>
            <Input value={supplierName} disabled className="bg-secondary/50 border-border rounded-xl opacity-70" />
          </div>
          {currentPrice && (
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Current Price</label>
              <Input value={`£${currentPrice.toFixed(2)}`} disabled className="bg-secondary/50 border-border rounded-xl opacity-70" />
            </div>
          )}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Alert me when price drops below (£)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 25.00"
              className="bg-secondary border-border rounded-xl"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Email for notification</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-secondary border-border rounded-xl"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-xl gap-2" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
            Set Price Alert
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We check eBay prices every 6 hours and email you when the price drops below your target.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertDialog;
