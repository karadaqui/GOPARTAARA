import { Loader2, Building2, Shield } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";

/* ── Stripe IDs ─────────────────────────────────────────── */

const STRIPE = {
  pro:              "price_1TK5ccAc5QcTT3aL7jb3xTlb",
  pro_annual:       "price_1TLlEVAc5QcTT3aLcHThonXZ",
  elite:            "price_1TKaEfAc5QcTT3aLUSzqrRIy",
  elite_annual:     "price_1TLlEWAc5QcTT3aLPEidfDng",
};

/* ── Plan data ──────────────────────────────────────────── */

type Variant = "free" | "pro" | "elite";

type Feature = { title: string; desc: string };

type Plan = {
  name: string;
  variant: Variant;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  annualBilled: string;
  features: Feature[];
  cta: string;
  priceId: string | null;
  annualPriceId: string | null;
};

const individualPlans: Plan[] = [
  {
    name: "Free",
    variant: "free",
    tagline: "Get started with basic searches",
    monthlyPrice: "£0",
    annualPrice: "£0",
    annualBilled: "",
    cta: "Get Started Free",
    priceId: null,
    annualPriceId: null,
    features: [
      { title: "20 searches per month", desc: "Search any part name, reg plate or VIN across all 7 suppliers." },
      { title: "5 saved parts", desc: "Bookmark parts you're interested in for quick access later." },
      { title: "5 price alerts", desc: "Get emailed when a part drops below your target price." },
      { title: "5 marketplace listings", desc: "List up to 5 parts for sale in the GOPARTARA marketplace." },
      { title: "1 vehicle in My Garage", desc: "Save your car to filter searches by make, model and year." },
    ],
  },
  {
    name: "Pro",
    variant: "pro",
    tagline: "For enthusiasts and DIY mechanics",
    monthlyPrice: "£9.99",
    annualPrice: "£7.99",
    annualBilled: "Billed £95.88/yr",
    cta: "Upgrade to Pro",
    priceId: STRIPE.pro,
    annualPriceId: STRIPE.pro_annual,
    features: [
      { title: "Unlimited searches", desc: "Search as many parts as you need, any time, with no monthly cap." },
      { title: "Photo search", desc: "Upload a photo of a part — we identify it and find the best price." },
      { title: "Unlimited saved parts", desc: "Save every part you're considering with no restrictions." },
      { title: "Unlimited price alerts", desc: "Set price targets on as many parts as you want." },
      { title: "Unlimited marketplace listings", desc: "Sell as many parts as you like with no listing limit." },
      { title: "Unlimited vehicles in My Garage", desc: "Track every car you own — filter searches by each vehicle." },
      { title: "Compare up to 5 parts at once", desc: "Side-by-side comparison of specs, prices and availability." },
      { title: "Search history", desc: "Revisit every search you've made with full history tracking." },
      { title: "Ad-free experience", desc: "No ads, no distractions. Just clean, fast search results." },
    ],
  },
  {
    name: "Elite",
    variant: "elite",
    tagline: "For mechanics & trade buyers",
    monthlyPrice: "£19.99",
    annualPrice: "£15.99",
    annualBilled: "Billed £191.88/yr",
    cta: "Go Elite",
    priceId: STRIPE.elite,
    annualPriceId: STRIPE.elite_annual,
    features: [
      { title: "Everything in Pro", desc: "All Pro features included, with no compromises." },
      { title: "Bulk compare (up to 20 parts)", desc: "Compare up to 20 parts simultaneously — perfect for mechanics." },
      { title: "CSV export", desc: "Export your price comparisons and saved parts to a spreadsheet." },
      { title: "Garage analytics", desc: "Track MOT, tax, service history and running costs per vehicle." },
      { title: "Priority support", desc: "Get faster responses from our team when you need help." },
      { title: "VAT invoices on request", desc: "Get a VAT invoice for your subscription — essential for UK business accounts." },
      { title: "2-seat team account", desc: "Share access with one colleague — ideal for garages with multiple staff." },
      { title: "Early access to new features", desc: "Be the first to try new GOPARTARA tools before they launch." },
    ],
  },
];

/* ── FAQ data ───────────────────────────────────────────── */

export const faqItems = [
  { q: "Can I cancel anytime?", a: "Yes, absolutely. Cancel anytime from your dashboard. No contracts, no cancellation fees. Your plan stays active until the end of the billing period." },
  { q: "What happens when I hit my 20 search limit on Free?", a: "You'll see a prompt to upgrade. You can still browse the site, but new searches will be paused until the next month or you upgrade to Pro." },
  { q: "Can I upgrade or downgrade my plan?", a: "Yes, you can change your plan anytime. Upgrades take effect immediately. Downgrades take effect at the next billing cycle." },
  { q: "How does the 30-day money back guarantee work?", a: "If you're not satisfied within 30 days of your first subscription, email us at info@gopartara.com and we'll issue a full refund — no questions asked." },
  { q: "Do you store my payment details?", a: "We use Stripe, the world's most trusted payment processor. We never store your card details on our servers." },
  { q: "Is there a plan for businesses or garages?", a: "Yes! We offer custom plans for garages, dealerships and trade buyers. Contact us at info@gopartara.com for a custom quote." },
  { q: "Do you offer refunds?", a: "Yes, full refund within 7 days of any paid subscription. No questions asked." },
  { q: "Can I use GOPARTARA for my garage business?", a: "Absolutely — our Elite plan is perfect for garages. For larger operations with 5+ users, contact us about our custom Business plan." },
];

const CHECKOUT_TIMEOUT_MS = 10_000;

const ctaStyles = (variant: Variant): React.CSSProperties => {
  if (variant === "pro") {
    return { background: "#22c55e", border: "none", color: "#ffffff", fontWeight: 600 };
  }
  if (variant === "elite") {
    return { background: "#cc1111", border: "none", color: "#ffffff", fontWeight: 600 };
  }
  return { background: "transparent", border: "1px solid #333333", color: "#666666", fontWeight: 500 };
};

const ctaHoverEnter = (variant: Variant, el: HTMLElement) => {
  if (variant === "pro") el.style.background = "#16a34a";
  else if (variant === "elite") el.style.background = "#aa0000";
  else el.style.borderColor = "#555";
};
const ctaHoverLeave = (variant: Variant, el: HTMLElement) => {
  if (variant === "pro") el.style.background = "#22c55e";
  else if (variant === "elite") el.style.background = "#cc1111";
  else el.style.borderColor = "#333333";
};

const Dot = ({ variant }: { variant: Variant }) => {
  const isElite = variant === "elite";
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: isElite ? "rgba(204,17,17,0.1)" : "rgba(34,197,94,0.1)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: isElite ? "#cc1111" : "#22c55e",
        }}
      />
    </span>
  );
};

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan: subPlan, trialEndsAt } = useSubscription();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const [annual, setAnnual] = useState(false);

  const hadTrial = !user ? false : !!(trialEndsAt || (subPlan && subPlan !== "free"));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const startCheckout = async (priceId: string | null) => {
    if (!priceId) {
      toast({ title: "Free plan", description: "You're already on the Free plan!" });
      return;
    }
    if (!user) { navigate("/auth"); return; }
    setLoadingId(priceId);
    setSlowWarning(false);
    timeoutRef.current = setTimeout(() => setSlowWarning(true), CHECKOUT_TIMEOUT_MS);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
      setLoadingId(null);
      setSlowWarning(false);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleProTrial = async () => {
    if (!user) { navigate("/auth"); return; }
    const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
    if (!raw) { navigate("/auth"); return; }
    const token = JSON.parse(raw)?.access_token;
    try {
      const r = await fetch('https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const d = await r.json();
      if (d.success) { toast({ title: '1 month Pro activated' }); setTimeout(() => window.location.reload(), 1500); }
      else toast({ title: d.error || 'Something went wrong', variant: 'destructive' });
    } catch { toast({ title: 'Connection error', variant: 'destructive' }); }
  };

  const annualSavings = (monthly: string, annualPerMonth: string): number => {
    const m = parseFloat(monthly.replace(/[^\d.]/g, "")) || 0;
    const a = parseFloat(annualPerMonth.replace(/[^\d.]/g, "")) || 0;
    return Math.round((m - a) * 12);
  };

  return (
    <section id="pricing" style={{ padding: "80px 24px 48px" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: "11px",
              color: "#cc1111",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            Pricing
          </p>
          <h1
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: "clamp(40px, 7vw, 64px)",
              color: "#ffffff",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
            }}
          >
            Plans for every driver.
          </h1>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              fontSize: "17px",
              color: "#666666",
              margin: 0,
            }}
          >
            Free to start. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          {["Cancel anytime", "First month free", "No hidden fees"].map((t) => (
            <span
              key={t}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#0d0d0d",
                border: "1px solid #1a1a1a",
                borderRadius: "100px",
                padding: "6px 16px",
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                fontSize: "12px",
                color: "#666666",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              {t}
            </span>
          ))}
        </div>

        {/* Monthly / Annual Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#0d0d0d",
              border: "1px solid #1a1a1a",
              borderRadius: "100px",
              padding: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => setAnnual(false)}
              style={{
                padding: "8px 20px",
                borderRadius: "100px",
                border: "none",
                background: !annual ? "#cc1111" : "transparent",
                color: !annual ? "#ffffff" : "#555555",
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: !annual ? 600 : 500,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              style={{
                padding: "8px 20px",
                borderRadius: "100px",
                border: "none",
                background: annual ? "#cc1111" : "transparent",
                color: annual ? "#ffffff" : "#555555",
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: annual ? 600 : 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Annual
              <span
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: "#22c55e",
                  borderRadius: "100px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div
          className="pricing-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {individualPlans.map((plan) => {
            const isPro = plan.variant === "pro";
            const showAnnual = annual && plan.variant !== "free";
            const displayPrice = showAnnual ? plan.annualPrice : plan.monthlyPrice;
            const effectivePriceId = showAnnual && plan.annualPriceId ? plan.annualPriceId : plan.priceId;
            const proTrialCta = isPro && !hadTrial;
            const ctaLabel = proTrialCta ? "Start Free — 1 Month Pro" : plan.cta;
            const yearlySaving = showAnnual ? annualSavings(plan.monthlyPrice, plan.annualPrice) : 0;
            const cta = ctaStyles(plan.variant);
            const loading = loadingId !== null && effectivePriceId === loadingId;

            return (
              <div
                key={plan.name}
                style={{
                  position: "relative",
                  background: "#0d0d0d",
                  border: isPro ? "2px solid #cc1111" : "1px solid #1a1a1a",
                  borderRadius: "20px",
                  padding: "36px 32px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {isPro && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-13px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#cc1111",
                      borderRadius: "100px",
                      padding: "4px 18px",
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 700,
                      fontSize: "11px",
                      color: "#fff",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    MOST POPULAR
                  </span>
                )}

                {/* Header */}
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#888888",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {plan.name}
                </div>
                <p
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: "13px",
                    color: "#444444",
                    margin: "4px 0 24px",
                  }}
                >
                  {plan.tagline}
                </p>

                {/* Price */}
                {showAnnual && (
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: "14px",
                      color: "#333333",
                      textDecoration: "line-through",
                      marginBottom: "4px",
                    }}
                  >
                    {plan.monthlyPrice}/mo
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 800,
                      fontSize: "52px",
                      color: "#ffffff",
                      lineHeight: 1,
                    }}
                  >
                    {displayPrice}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: "16px",
                      color: "#444444",
                    }}
                  >
                    /mo
                  </span>
                </div>
                {showAnnual && (
                  <>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: "12px",
                        color: "#444444",
                        marginTop: "6px",
                      }}
                    >
                      {plan.annualBilled}
                    </div>
                    {yearlySaving > 0 && (
                      <span
                        style={{
                          alignSelf: "flex-start",
                          marginTop: "10px",
                          background: "rgba(34,197,94,0.1)",
                          color: "#22c55e",
                          fontSize: "11px",
                          fontWeight: 600,
                          borderRadius: "100px",
                          padding: "3px 10px",
                        }}
                      >
                        Save £{yearlySaving}/year
                      </span>
                    )}
                  </>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: "#1a1a1a", margin: "24px 0" }} />

                {/* CTA */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={proTrialCta ? handleProTrial : () => startCheckout(effectivePriceId)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    ...cta,
                  }}
                  onMouseEnter={(e) => ctaHoverEnter(plan.variant, e.currentTarget)}
                  onMouseLeave={(e) => ctaHoverLeave(plan.variant, e.currentTarget)}
                >
                  {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Loader2 size={16} className="animate-spin" />
                      {slowWarning ? "Taking longer than expected…" : "Redirecting…"}
                    </span>
                  ) : ctaLabel}
                </button>

                {/* What's included */}
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#444444",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "28px 0 16px",
                  }}
                >
                  What's included:
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                  {plan.features.map((f) => (
                    <li key={f.title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <Dot variant={plan.variant} />
                      <div>
                        <div
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontWeight: 500,
                            fontSize: "13px",
                            color: "#cccccc",
                          }}
                        >
                          {f.title}
                        </div>
                        <div
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontWeight: 400,
                            fontSize: "12px",
                            color: "#555555",
                            lineHeight: 1.5,
                            marginTop: "2px",
                          }}
                        >
                          {f.desc}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            borderTop: "1px solid #1a1a1a",
            marginTop: "32px",
          }}
        >
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: "14px",
              color: "#555555",
              margin: "0 0 16px",
            }}
          >
            Trusted by drivers across the UK
          </p>
          <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
            {["No credit card required", "Cancel anytime", "First month free on Pro"].map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "1px solid #1a1a1a",
                  borderRadius: "100px",
                  padding: "6px 16px",
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#444444",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Promo code */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "12px",
              color: "#666666",
              marginBottom: "10px",
            }}
          >
            Have a promo code?
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", maxWidth: "320px", margin: "0 auto" }}>
            <input
              id="promoInput"
              type="text"
              placeholder="Enter code"
              style={{
                flex: 1,
                background: "#0d0d0d",
                border: "1px solid #1a1a1a",
                borderRadius: "12px",
                padding: "10px 14px",
                color: "#ffffff",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "13px",
                outline: "none",
                textTransform: "uppercase",
              }}
            />
            <button
              type="button"
              onClick={async () => {
                const el = document.getElementById('promoInput') as HTMLInputElement | null;
                const code = el?.value.trim().toUpperCase();
                if (!code) return;
                const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
                if (!raw) { toast({ title: 'Please sign in first', variant: 'destructive' }); return; }
                const token = JSON.parse(raw)?.access_token;
                try {
                  const r = await fetch('https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ promoCode: code })
                  });
                  const d = await r.json();
                  if (d.success) { toast({ title: '1 month Pro activated' }); setTimeout(() => window.location.reload(), 1500); }
                  else if (d.already_used) { toast({ title: d.message }); }
                  else toast({ title: d.error || 'Invalid code', variant: 'destructive' });
                } catch { toast({ title: 'Connection error', variant: 'destructive' }); }
              }}
              style={{
                background: "#cc1111",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "10px 18px",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          </div>
        </div>

        {/* For Garages & Trade Buyers */}
        <div
          style={{
            marginTop: "56px",
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            borderRadius: "20px",
            padding: "40px",
            textAlign: "center",
            maxWidth: "780px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Building2 size={20} style={{ color: "#cc1111" }} />
            <h3
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: "36px",
                color: "#ffffff",
                margin: 0,
                lineHeight: 1,
              }}
            >
              For Garages &amp; Trade Buyers
            </h3>
          </div>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              fontSize: "14px",
              color: "#666666",
              maxWidth: "480px",
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            Custom plans for garages, dealerships and trade accounts. Bulk search, team access, and dedicated support.
          </p>
          <Link
            to="/business"
            style={{
              display: "inline-block",
              background: "transparent",
              border: "1px solid #333333",
              borderRadius: "12px",
              padding: "12px 24px",
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: "14px",
              color: "#ffffff",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#555"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#333333"; }}
          >
            Contact Us for a Quote
          </Link>
        </div>

        {/* Money Back Guarantee */}
        <div
          style={{
            marginTop: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "16px 24px",
            borderRadius: "12px",
            border: "1px solid #1a1a1a",
            background: "#0d0d0d",
            maxWidth: "640px",
            margin: "48px auto 0",
          }}
        >
          <Shield size={18} style={{ color: "#cc1111", flexShrink: 0 }} />
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "13px",
              color: "#888888",
              margin: 0,
              textAlign: "center",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: 600 }}>30-Day Money Back Guarantee</span> — Not happy? Get a full refund within 30 days, no questions asked.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "80px", maxWidth: "720px", margin: "80px auto 0" }}>
          <h3
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: "36px",
              color: "#ffffff",
              textAlign: "center",
              margin: "0 0 32px",
              lineHeight: 1,
            }}
          >
            Frequently asked questions
          </h3>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="px-5"
                style={{ border: "1px solid #1a1a1a", borderRadius: "12px", background: "#0d0d0d" }}
              >
                <AccordionTrigger
                  className="hover:no-underline py-4"
                  style={{ fontFamily: '"DM Sans", sans-serif', fontSize: "14px", fontWeight: 500, color: "#ffffff" }}
                >
                  {item.q}
                </AccordionTrigger>
                <AccordionContent
                  className="pb-4"
                  style={{ fontFamily: '"DM Sans", sans-serif', fontSize: "14px", color: "#888888", lineHeight: 1.6 }}
                >
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
        }
      `}</style>
    </section>
  );
};

export default PricingSection;
