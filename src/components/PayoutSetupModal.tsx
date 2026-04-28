import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PayoutInfo {
  full_name: string | null;
  sort_code: string | null;
  account_number: string | null;
  paypal_email: string | null;
  preferred_method: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSaved?: () => void;
  /** If provided, called after a successful save (e.g. open listing form). */
  continueLabel?: string;
}

const SORT_CODE_RE = /^\d{2}-\d{2}-\d{2}$/;
const ACCOUNT_RE = /^\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PayoutSetupModal({
  open,
  onOpenChange,
  userId,
  onSaved,
  continueLabel = "Save & Continue to Listing →",
}: Props) {
  const [tab, setTab] = useState<"bank" | "paypal">("bank");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("seller_payout_info" as any)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (cancelled) return;
        const p = (data as any as PayoutInfo) || null;
        if (p) {
          setFullName(p.full_name || "");
          setSortCode(p.sort_code || "");
          setAccountNumber(p.account_number || "");
          setPaypalEmail(p.paypal_email || "");
          setTab(p.preferred_method === "paypal" && p.paypal_email && !p.account_number ? "paypal" : "bank");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const formatSortCode = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    return digits.replace(/(\d{2})(?=\d)/g, "$1-");
  };

  const handleSave = async () => {
    if (tab === "bank") {
      if (!fullName.trim()) return toast.error("Full name is required");
      if (!SORT_CODE_RE.test(sortCode)) return toast.error("Sort code must be in XX-XX-XX format");
      if (!ACCOUNT_RE.test(accountNumber)) return toast.error("Account number must be 8 digits");
    } else {
      if (!EMAIL_RE.test(paypalEmail)) return toast.error("Valid PayPal email required");
    }

    setSaving(true);
    try {
      const payload: any = {
        user_id: userId,
        preferred_method: tab,
        full_name: tab === "bank" ? fullName.trim() : (fullName.trim() || null),
        sort_code: tab === "bank" ? sortCode : null,
        account_number: tab === "bank" ? accountNumber : null,
        paypal_email: tab === "paypal" ? paypalEmail.trim() : (paypalEmail.trim() || null),
      };
      const { error } = await supabase
        .from("seller_payout_info" as any)
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Payout details saved ✓");
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to save payout details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>💳 Set up payouts before selling</DialogTitle>
          <DialogDescription>
            Before you can list parts for sale, add your payment details so we can send you money when your parts sell.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "bank" | "paypal")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank">🏦 Bank Transfer</TabsTrigger>
              <TabsTrigger value="paypal">💙 PayPal</TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-3 mt-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Full Name *</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" maxLength={100} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sort Code *</label>
                <Input
                  value={sortCode}
                  onChange={(e) => setSortCode(formatSortCode(e.target.value))}
                  placeholder="12-34-56"
                  maxLength={8}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Account Number *</label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="12345678"
                  maxLength={8}
                  inputMode="numeric"
                />
              </div>
            </TabsContent>

            <TabsContent value="paypal" className="space-y-3 mt-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">PayPal Email *</label>
                <Input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="you@paypal.com"
                  maxLength={255}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="sm:flex-1">
            Not now
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="sm:flex-1">
            {saving ? <Loader2 className="animate-spin" size={16} /> : continueLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
