import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, PartyPopper, Shield, RefreshCw, Mail } from "lucide-react";

const PLAN_FEATURES: Record<string, { label: string; features: string[] }> = {
  pro: {
    label: "Pro",
    features: [
      "Unlimited searches",
      "Photo search (AI-powered)",
      "Price alerts",
      "Unlimited garage vehicles",
      "Full search history",
    ],
  },
  elite: {
    label: "Elite",
    features: [
      "Everything in Pro",
      "CSV export of search history",
      "30-day price tracking",
      "Vehicle maintenance notes",
      "Priority email support",
      "Early access to new features",
    ],
  },
  basic_seller: {
    label: "Basic Seller",
    features: [
      "Seller profile page",
      "Up to 20 active listings",
      "Basic listing analytics",
    ],
  },
  featured_seller: {
    label: "Featured Seller",
    features: [
      "Up to 100 active listings",
      "Featured placement in marketplace",
      "Advanced analytics dashboard",
    ],
  },
  pro_seller: {
    label: "Pro Seller",
    features: [
      "Unlimited active listings",
      "Top placement in marketplace",
      "Verified seller badge",
      "Full analytics suite",
    ],
  },
};

const WelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [planKey, setPlanKey] = useState("pro");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      const plan = searchParams.get("plan") || "pro";
      setPlanKey(plan);
      setOpen(true);
      // Clean URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout");
      newParams.delete("plan");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  const planInfo = PLAN_FEATURES[planKey] || PLAN_FEATURES.pro;
  const refundDate = new Date();
  refundDate.setDate(refundDate.getDate() + 7);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-primary/20">
        {/* Confetti header */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none text-4xl opacity-40 flex flex-wrap justify-center items-start gap-2 pt-2">
            {"🎊✨🎉🥳🎊✨🎉🥳🎊✨".split("").map((e, i) => (
              <span key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>{e}</span>
            ))}
          </div>
          <PartyPopper className="mx-auto text-primary mb-3" size={40} />
          <h2 className="font-display text-2xl font-bold">
            Welcome to GOPARTARA {planInfo.label}! 🎉
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Thank you for subscribing</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Features */}
          <div>
            <p className="text-sm font-semibold mb-3">Features unlocked:</p>
            <ul className="space-y-2">
              {planInfo.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info boxes */}
          <div className="space-y-2">
            <div className="rounded-xl bg-secondary/60 border border-border p-3 flex items-start gap-2.5">
              <Shield size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Refund Policy:</span> You have 7 days from today to request a full refund if you are not satisfied.
              </p>
            </div>
            <div className="rounded-xl bg-secondary/60 border border-border p-3 flex items-start gap-2.5">
              <RefreshCw size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Subscription Policy:</span> Your subscription renews monthly. Cancel anytime from your dashboard.
              </p>
            </div>
            <div className="rounded-xl bg-secondary/60 border border-border p-3 flex items-start gap-2.5">
              <Mail size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Need help?</span> Contact us at info@gopartara.com or visit our Contact page.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => { setOpen(false); navigate("/"); }}
            >
              Start Exploring
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={() => { setOpen(false); navigate("/dashboard"); }}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
