import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Gift, Users, Zap, MessageCircle, Mail } from "lucide-react";

interface ReferralSectionProps {
  userId: string;
  referralCode: string | null;
  bonusSearches: number;
}

const ReferralSection = ({ userId, referralCode, bonusSearches }: ReferralSectionProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  const referralLink = referralCode
    ? `https://gopartara.com/auth?ref=${referralCode}`
    : "";

  useEffect(() => {
    if (userId) {
      fetchReferralCount();
    }
  }, [userId]);

  const fetchReferralCount = async () => {
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId);
    setReferralCount(count || 0);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const earnedDescription = referralCount > 0
    ? `${referralCount} friend${referralCount === 1 ? "" : "s"} referred · ${bonusSearches} bonus searches earned`
    : "0 friends referred · £0 earned so far";

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-2">
        <Gift size={18} className="text-primary" />
        Referral Program
      </h2>
      <p className="text-sm text-muted-foreground mb-1">
        Share your link — you both get{" "}
        <span className="text-primary font-semibold">5 bonus searches</span> when someone signs up!
      </p>
      <p style={{ fontSize: "13px", color: "#71717a", marginBottom: "16px" }}>
        {earnedDescription}
      </p>

      {/* Referral link */}
      <div className="flex gap-2 mb-6">
        <Input
          value={referralLink}
          readOnly
          className="bg-secondary border-border h-11 rounded-xl text-sm font-mono"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl shrink-0"
          onClick={handleCopy}
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </Button>
      </div>

      {/* Refer a Friend — share card */}
      {referralLink && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(251,191,36,0.03))",
            border: "1px solid rgba(251,191,36,0.30)",
          }}
        >
          <h3 className="font-display text-base font-semibold mb-1 flex items-center gap-2">
            🎁 Refer a Friend
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Invite a friend to GOPARTARA. When they sign up, you both get{" "}
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>1 month Pro free</span>.
          </p>
          <div className="flex gap-2 mb-3">
            <Input
              value={`gopartara.com/join?ref=${referralCode}`}
              readOnly
              className="bg-secondary border-border h-10 rounded-xl text-sm font-mono"
            />
            <Button
              onClick={handleCopy}
              className="h-10 rounded-xl shrink-0 gap-1.5"
              style={{
                background: copied ? "#16a34a" : "#fbbf24",
                color: "#0a1628",
                fontWeight: 600,
              }}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hey! I've been using GOPARTARA to find car parts at the best prices. Sign up with my link and we both get 1 month Pro free: https://gopartara.com/join?ref=${referralCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "#25D366", color: "#fff" }}
            >
              <MessageCircle size={14} /> Share on WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent("Get 1 month Pro free on GOPARTARA")}&body=${encodeURIComponent(
                `Hey,\n\nI've been using GOPARTARA to find car parts at the best prices. Sign up with my link and we both get 1 month Pro free:\n\nhttps://gopartara.com/join?ref=${referralCode}\n\nEnjoy!`
              )}`}
              className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors bg-secondary hover:bg-secondary/70 text-foreground border border-border"
            >
              <Mail size={14} /> Share via Email
            </a>
          </div>
        </div>
      )}

      {/* How it works — 3 step guide */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          How it works
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { n: 1, label: "Share your link" },
            { n: 2, label: "Friend signs up" },
            { n: 3, label: "You both get Pro free" },
          ].map((step, idx) => (
            <div key={step.n} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="shrink-0 inline-flex items-center justify-center rounded-full"
                  style={{
                    width: "22px",
                    height: "22px",
                    background: "rgba(204,17,17,0.12)",
                    border: "1px solid rgba(204,17,17,0.4)",
                    color: "#cc1111",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {step.n}
                </span>
                <span className="text-xs sm:text-[13px] text-zinc-300 truncate">
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div
                  className="flex-1 mx-2 sm:mx-3 hidden sm:block"
                  style={{
                    height: "1px",
                    borderTop: "1px dashed #3f3f46",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-xl p-4 text-center">
          <Users size={18} className="text-primary mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">People Referred</p>
          <p className="font-display font-bold text-xl">{referralCount}</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-4 text-center">
          <Zap size={18} className="text-primary mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">Bonus Searches</p>
          <p className="font-display font-bold text-xl">{bonusSearches}</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;
