import { Check, X, Loader2, Star, Zap, Shield, Building2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";

/* ── Stripe IDs ─────────────────────────────────────────── */

const STRIPE = {
  pro:              "price_1TK5ccAc5QcTT3aL7jb3xTlb",
  pro_annual:       "price_1TLlEVAc5QcTT3aLcHThonXZ",
  elite:            "price_1TKaEfAc5QcTT3aLUSzqrRIy",
  elite_annual:     "price_1TLlEWAc5QcTT3aLPEidfDng",
  basic_seller:     "price_1TKUmsAc5QcTT3aLrLoieucV",
  featured_seller:  "price_1TKUnQAc5QcTT3aLAHq0CpaN",
  pro_seller:       "price_1TKUo4Ac5QcTT3aLU2WNxx5F",
  pro_basic_seller:     "price_1TKaEgAc5QcTT3aLnsB1kD4Y",
  pro_featured_seller:  "price_1TKaEiAc5QcTT3aLx8pv4fRW",
  pro_pro_seller:       "price_1TKaEjAc5QcTT3aLXOC91pWE",
  elite_basic_seller:   "price_1TKaEjAc5QcTT3aL7rqOeGDF",
  elite_featured_seller:"price_1TKaEkAc5QcTT3aLrEa0prdA",
  elite_pro_seller:     "price_1TKaEpAc5QcTT3aLCtIpVhmG",
};

/* ── Plan data ──────────────────────────────────────────── */

const individualPlans = [
  {
    name: "Free",
    tagline: "Get started with basic searches",
    monthlyPrice: "£0",
    annualPrice: "£0",
    annualBilled: "",
    period: "/mo",
    features: ["10 searches per month", "5 active marketplace listings", "Save up to 5 parts & alerts", "1 garage vehicle", "Referral bonuses"],
    cta: "Start Free",
    popular: false,
    priceId: null as string | null,
    annualPriceId: null as string | null,
  },
  {
    name: "Pro",
    tagline: "For enthusiasts and DIY mechanics",
    monthlyPrice: "£9.99",
    annualPrice: "£7.99",
    annualBilled: "Billed £95.88/yr",
    period: "/mo",
    features: ["Unlimited searches", "Photo search", "Unlimited marketplace listings", "Unlimited parts & alerts", "Unlimited garage vehicles", "Search history", "Price alerts", "Ad-free experience", "10 photos per listing"],
    cta: "Go Pro",
    popular: true,
    priceId: STRIPE.pro,
    annualPriceId: STRIPE.pro_annual,
  },
  {
    name: "Elite",
    tagline: "The complete experience",
    monthlyPrice: "£19.99",
    annualPrice: "£15.99",
    annualBilled: "Billed £191.88/yr",
    period: "/mo",
    features: ["Everything in Pro", "Export search history CSV", "30-day price tracking", "Vehicle notes & history", "Early access to features", "Priority email support", "Analytics dashboard"],
    cta: "Go Elite",
    popular: false,
    priceId: STRIPE.elite,
    annualPriceId: STRIPE.elite_annual,
  },
];


/* ── Comparison table data ──────────────────────────────── */

const comparisonRows: { feature: string; free: string; pro: string; elite: string }[] = [
  { feature: "Monthly searches", free: "5", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Marketplace listings", free: "5", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Photo search", free: "✗", pro: "✓", elite: "✓" },
  { feature: "Reg plate search", free: "✓", pro: "✓", elite: "✓" },
  { feature: "Price alerts", free: "✓", pro: "✓", elite: "✓" },
  { feature: "Garage vehicles", free: "1", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Search history", free: "✗", pro: "✓", elite: "✓" },
  { feature: "Ad-free experience", free: "✗", pro: "✓", elite: "✓" },
  { feature: "Export CSV", free: "✗", pro: "✗", elite: "✓" },
  { feature: "30-day price tracking", free: "✗", pro: "✗", elite: "✓" },
  { feature: "Vehicle notes", free: "✗", pro: "✗", elite: "✓" },
  { feature: "Analytics dashboard", free: "✗", pro: "✗", elite: "✓" },
  { feature: "Priority email support", free: "✗", pro: "✗", elite: "✓" },
];

/* ── FAQ data ───────────────────────────────────────────── */

const faqItems = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. Cancel anytime from your dashboard. No contracts, no cancellation fees. Your plan stays active until the end of the billing period.",
  },
  {
    q: "What happens when I hit my 10 search limit on Free?",
    a: "You'll see a prompt to upgrade. You can still browse the site, but new searches will be paused until the next month or you upgrade to Pro.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes, you can change your plan anytime. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "How does the 30-day money back guarantee work?",
    a: "If you're not satisfied within 30 days of your first subscription, email us at info@gopartara.com and we'll issue a full refund — no questions asked.",
  },
  {
    q: "Do you store my payment details?",
    a: "We use Stripe, the world's most trusted payment processor. We never store your card details on our servers.",
  },
  {
    q: "Is there a plan for businesses or garages?",
    a: "Yes! We offer custom plans for garages, dealerships and trade buyers. Contact us at info@gopartara.com for a custom quote.",
  },
];


const CHECKOUT_TIMEOUT_MS = 10_000;

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [hadTrial, setHadTrial] = useState(true); // default true to avoid flash

  useEffect(() => {
    if (!user) { setHadTrial(false); return; }
    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("trial_ends_at, subscription_period, subscription_plan")
          .eq("user_id", user.id).maybeSingle();
        setHadTrial(!!(data?.trial_ends_at || (data?.subscription_plan && data.subscription_plan !== "free")));
      } catch {}
    })();
  }, [user]);
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

  const isLoading = (id: string | null) => id !== null && loadingId === id;


  return (
    <section id="pricing" className="py-24">
      <div className="container max-w-5xl px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Simple, transparent <span className="text-primary">pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Choose the plan that works for you. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Annual / Monthly Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
          </span>
          <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            Save 20%
          </span>
        </div>

        {/* Individual Plans */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {individualPlans.map((plan) => {
            const effectivePriceId = annual && plan.annualPriceId ? plan.annualPriceId : plan.priceId;
            const proTrialCta = plan.name === "Pro" && !hadTrial;
            return (
              <PlanCard
                key={plan.name}
                name={plan.name}
                tagline={plan.tagline}
                price={annual ? plan.annualPrice : plan.monthlyPrice}
                originalPrice={annual && plan.annualPrice !== plan.monthlyPrice ? plan.monthlyPrice : undefined}
                billedNote={annual ? plan.annualBilled : undefined}
                period={plan.period}
                features={plan.features}
                cta={proTrialCta ? "Start Free — 1 Month Pro" : plan.cta}
                ctaSubtext={proTrialCta ? "No credit card required" : undefined}
                popular={plan.popular}
                loading={isLoading(effectivePriceId)}
                slowWarning={slowWarning}
                onSelect={proTrialCta ? async () => {
                  if (!user) { navigate("/auth"); return; }
                  const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
                  if (!raw) { navigate("/auth"); return; }
                  const token = JSON.parse(raw)?.access_token;
                  try {
                    const r = await fetch('https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial', {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({})
                    });
                    const d = await r.json();
                    if (d.success) { toast({ title: '🎉 1 month Pro activated!' }); setTimeout(() => window.location.reload(), 1500); }
                    else toast({ title: d.error || 'Something went wrong', variant: 'destructive' });
                  } catch { toast({ title: 'Connection error', variant: 'destructive' }); }
                } : () => startCheckout(effectivePriceId)}
              />
            );
          })}
        </div>

        {/* Promo code section */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-xs mb-2">Got a secret code? 👀</p>
          <div className="flex gap-2 justify-center max-w-[280px] mx-auto">
            <input
              id="promoInput"
              type="text"
              placeholder="🤫 psst... try COMMUNITY"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-foreground text-[13px] outline-none focus:border-primary"
            />
            <button
              onClick={async () => {
                const el = document.getElementById('promoInput') as HTMLInputElement | null;
                const code = el?.value.trim().toUpperCase();
                if (!code) return;
                const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
                if (!raw) { toast({ title: 'Please sign in first', variant: 'destructive' }); return; }
                const token = JSON.parse(raw)?.access_token;
                try {
                  const r = await fetch('https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ promoCode: code })
                  });
                   const d = await r.json();
                  if (d.success) { toast({ title: '🎉 1 month Pro activated!' }); setTimeout(() => window.location.reload(), 1500); }
                  else if (d.already_used) { toast({ title: d.message }); }
                  else toast({ title: d.error || 'Invalid code', variant: 'destructive' });
                } catch { toast({ title: 'Connection error', variant: 'destructive' }); }
              }}
              className="bg-primary text-primary-foreground border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Business CTA */}
        <div className="mt-12 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-8 sm:p-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 size={22} className="text-primary" />
            <h3 className="font-display text-xl font-bold text-foreground">For Garages & Trade Buyers</h3>
          </div>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
            Custom plans for garages, dealerships and trade accounts. Bulk search, team access, and dedicated support.
          </p>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to="/business">Contact Us for a Quote</Link>
          </Button>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h3 className="font-display text-2xl font-bold text-center mb-8 tracking-tight">Compare all features</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-primary font-semibold">Pro</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Elite</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-border/20 hover:bg-card/40 transition-colors">
                    <td className="py-3 px-4 text-foreground">{row.feature}</td>
                    <ComparisonCell value={row.free} />
                    <ComparisonCell value={row.pro} />
                    <ComparisonCell value={row.elite} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="mt-16 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl border border-border/30 bg-card/20 mx-auto max-w-2xl">
          <Shield size={18} className="text-primary shrink-0" />
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">30-Day Money Back Guarantee</span> — Not happy? Get a full refund within 30 days, no questions asked.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h3 className="font-display text-2xl font-bold text-center mb-8 tracking-tight">Frequently asked questions</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/30 rounded-xl px-5 bg-card/30 backdrop-blur-sm">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

/* ── Comparison Cell ────────────────────────────────────── */

const ComparisonCell = ({ value }: { value: string }) => (
  <td className="text-center py-3 px-4">
    {value === "✓" ? (
      <Check size={16} className="inline text-emerald-400" />
    ) : value === "✗" ? (
      <X size={16} className="inline text-muted-foreground/40" />
    ) : (
      <span className="text-foreground font-medium">{value}</span>
    )}
  </td>
);

/* ── Reusable Plan Card ─────────────────────────────────── */

interface PlanCardProps {
  name: string;
  tagline: string;
  price: string;
  period: string;
  originalPrice?: string;
  billedNote?: string;
  features?: string[];
  searchFeatures?: string[];
  sellerFeatures?: string[];
  cta: string;
  ctaSubtext?: string;
  popular: boolean;
  loading: boolean;
  slowWarning: boolean;
  onSelect: () => void;
  was?: string;
  saving?: string;
  icon?: React.ElementType;
}

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3 text-sm text-secondary-foreground">
    <Check size={16} className="text-primary shrink-0 mt-0.5" />
    {text}
  </li>
);

const PlanCard = ({
  name, tagline, price, period, originalPrice, billedNote, features, searchFeatures, sellerFeatures, cta, ctaSubtext, popular, loading, slowWarning, onSelect, was, saving, icon: Icon,
}: PlanCardProps) => {
  const isBundle = !!(searchFeatures && sellerFeatures);

  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 border ${
        popular
          ? "border-primary/60 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] scale-[1.02] z-10 bg-card"
          : "border-border/30 bg-card/50 hover:border-border/60 hover:-translate-y-1"
      }`}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 text-xs font-semibold px-4 py-1 rounded-full bg-primary text-primary-foreground shadow-md">
            <Star size={10} fill="currentColor" /> Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={18} className="text-primary" />}
        <h3 className="font-display text-xl font-bold text-foreground">{name}</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-6">{tagline}</p>

      <div className="mb-1">
        {was && <span className="text-muted-foreground/60 line-through text-sm mr-2">{was}</span>}
        {originalPrice && <span className="text-muted-foreground/60 line-through text-sm mr-2">{originalPrice}</span>}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-display text-5xl font-bold text-foreground tracking-tight">{price}</span>
        <span className="text-muted-foreground text-base">{period}</span>
      </div>
      {billedNote ? (
        <p className="text-xs text-muted-foreground mb-2">{billedNote}</p>
      ) : null}
      {saving ? (
        <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
          <Zap size={10} /> Save {saving}/mo
        </span>
      ) : <div className="mb-6" />}

      <div className="h-px bg-border/40 mb-6" />

      {/* Features */}
      <div className="flex-1 mb-8">
        {isBundle ? (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">🔍 Search Features</p>
            <ul className="space-y-2.5 mb-5">
              {searchFeatures.map((f) => <FeatureItem key={f} text={f} />)}
            </ul>
            <div className="h-px bg-border/30 mb-5" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">🏪 Seller Features</p>
            <ul className="space-y-2.5">
              {sellerFeatures.map((f) => <FeatureItem key={f} text={f} />)}
            </ul>
          </>
        ) : (
          <ul className="space-y-3">
            {features?.map((f) => <FeatureItem key={f} text={f} />)}
          </ul>
        )}
      </div>

      <Button
        variant={popular ? "default" : "outline"}
        className="w-full rounded-xl h-11 text-sm font-medium"
        disabled={loading}
        onClick={onSelect}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {slowWarning ? "Taking longer than expected…" : "Redirecting…"}
          </span>
        ) : cta}
      </Button>
      {ctaSubtext && (
        <p className="text-xs text-muted-foreground text-center mt-2">{ctaSubtext}</p>
      )}
    </div>
  );
};

export default PricingSection;
