import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
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
}

const PriceAlertDialog = ({ supplierName, partQuery, supplierUrl }: PriceAlertDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
    setOpen(isOpen);
    if (isOpen) {
      setEmail(user?.email || "");
      setTargetPrice("");
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
    });
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Alert set!", description: `We'll notify you when ${partQuery} drops below £${price.toFixed(2)} at ${supplierName}.` });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors opacity-0 group-hover:opacity-100"
          title="Set price alert"
          onClick={(e) => e.stopPropagation()}
        >
          <Bell size={13} />
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
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Target Price (£)</label>
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
            Set Alert
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Price checking coming soon — your alert will be saved and ready when automated checks are enabled.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertDialog;
