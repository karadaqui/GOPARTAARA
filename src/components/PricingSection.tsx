import { Check, Loader2, Sparkles, Crown, Star, Store, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";

/* ── Stripe IDs ─────────────────────────────────────────── */

const STRIPE = {
  // Individual plans
  pro:              "price_1TK5ccAc5QcTT3aL7jb3xTlb",
  elite:            "price_1TKaEfAc5QcTT3aLUSzqrRIy",
  basic_seller:     "price_1TKUmsAc5QcTT3aLrLoieucV",
  featured_seller:  "price_1TKUnQAc5QcTT3aLAHq0CpaN",
  pro_seller:       "price_1TKUo4Ac5QcTT3aLU2WNxx5F",
  // Bundles
  pro_basic_seller:     "price_1TKaEgAc5QcTT3aLnsB1kD4Y",
  pro_featured_seller:  "price_1TKaEiAc5QcTT3aLx8pv4fRW",
  pro_pro_seller:       "price_1TKaEjAc5QcTT3aLXOC91pWE",
  elite_basic_seller:   "price_1TKaEjAc5QcTT3aL7rqOeGDF",
  elite_featured_seller:"price_1TKaEkAc5QcTT3aLrEa0prdA",
  elite_pro_seller:     "price_1TKaEpAc5QcTT3aLCtIpVhmG",
};

/* ── Bundle data ────────────────────────────────────────── */

const bundles = [
  {
    name: "Pro Seller Basic",
    includes: ["Pro", "Basic Seller"],
    originalPrice: "£19.98",
    price: "£16.99",
    saving: "£3",
    popular: false,
    priceId: STRIPE.pro_basic_seller,
    features: ["Unlimited searches", "Photo search", "Price alerts", "20 listings", "Basic analytics"],
  },
  {
    name: "Pro Featured",
    includes: ["Pro", "Featured Seller"],
    originalPrice: "£34.98",
    price: "£29.99",
    saving: "£5",
    popular: true,
    priceId: STRIPE.pro_featured_seller,
    features: ["Unlimited searches", "Photo search", "Price alerts", "100 listings", "Featured placement", "Advanced analytics"],
  },
  {
    name: "Pro Elite",
    includes: ["Pro", "Pro Seller"],
    originalPrice: "£59.98",
    price: "£49.99",
    saving: "£10",
    popular: false,
    priceId: STRIPE.pro_pro_seller,
    features: ["Unlimited searches", "Photo search", "Price alerts", "Unlimited listings", "Top placement", "Verified badge"],
  },
  {
    name: "Elite Seller",
    includes: ["Elite", "Basic Seller"],
    originalPrice: "£29.98",
    price: "£25.99",
    saving: "£4",
    popular: false,
    priceId: STRIPE.elite_basic_seller,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "Vehicle notes", "20 listings", "Basic analytics"],
  },
  {
    name: "Elite Featured",
    includes: ["Elite", "Featured Seller"],
    originalPrice: "£44.98",
    price: "£37.99",
    saving: "£7",
    popular: false,
    priceId: STRIPE.elite_featured_seller,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "Vehicle notes", "100 listings", "Featured placement"],
  },
  {
    name: "Elite Pro",
    includes: ["Elite", "Pro Seller"],
    originalPrice: "£69.98",
    price: "£57.99",
    saving: "£12",
    popular: false,
    priceId: STRIPE.elite_pro_seller,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "Vehicle notes", "Unlimited listings", "Top placement"],
  },
];

const individualPlans = [
  {
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Get started with basic searches",
    features: ["5 searches per month", "Save up to 5 parts & alerts", "1 garage vehicle", "Referral bonuses"],
    cta: "Start Free",
    popular: false,
    priceId: null,
  },
  {
    name: "Pro",
    price: "£9.99",
    period: "/month",
    description: "For enthusiasts and DIY mechanics",
    features: ["Unlimited searches", "Photo search", "Unlimited parts & alerts", "Unlimited garage", "Search history", "Price alerts"],
    cta: "Go Pro",
    popular: false,
    priceId: STRIPE.pro,
  },
  {
    name: "Elite",
    price: "£19.99",
    period: "/month",
    description: "The complete experience",
    features: [
      "Everything in Pro",
      "Export search history CSV",
      "30-day price tracking",
      "Vehicle notes & history",
      "Early access to features",
      "Priority email support",
    ],
    cta: "Go Elite",
    popular: false,
    priceId: STRIPE.elite,
  },
];

const sellerPlans = [
  {
    name: "Basic Seller",
    price: "£9.99",
    period: "/month",
    icon: Store,
    description: "Get listed in the PARTARA marketplace",
    features: ["20 listings", "Basic analytics"],
    cta: "Get Started",
    popular: false,
    priceId: STRIPE.basic_seller,
  },
  {
    name: "Featured Seller",
    price: "£24.99",
    period: "/month",
    icon: Star,
    description: "Stand out with premium placement",
    features: ["100 listings", "Featured placement", "Advanced analytics"],
    cta: "Go Featured",
    popular: true,
    priceId: STRIPE.featured_seller,
  },
  {
    name: "Pro Seller",
    price: "£49.99",
    period: "/month",
    icon: Crown,
    description: "Maximum visibility for your business",
    features: ["Unlimited listings", "Top placement", "Verified badge"],
    cta: "Go Pro Seller",
    popular: false,
    priceId: STRIPE.pro_seller,
  },
];

const CHECKOUT_TIMEOUT_MS = 10_000;

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const startCheckout = async (priceId: string) => {
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

  const loading = (id: string | null) => id !== null && loadingId === id;

  const LoadingLabel = () => (
    <span className="flex items-center gap-2">
      <Loader2 size={16} className="animate-spin" />
      {slowWarning ? "Taking longer than expected…" : "Redirecting to checkout…"}
    </span>
  );

  /* ─────────────────── Render ─────────────────── */

  return (
    <div className="space-y-32">
      {/* ── BUNDLE PLANS ─────────────────────────────── */}
      <section className="py-24">
        <div className="container px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
              <Sparkles size={14} /> Best Value
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Bundle &amp; <span className="text-gradient">Save</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Combine a buyer plan with a seller plan and save every month. One subscription, full access.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {bundles.map((b) => (
              <div
                key={b.name}
                className={`group relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  b.popular ? "glass glow-red border-primary/50" : "glass hover:border-primary/20"
                }`}
              >
                {b.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full bg-primary text-primary-foreground flex items-center gap-1">
                    <Star size={10} /> Most Popular
                  </span>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {b.includes.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h3 className="font-display text-xl font-bold mb-1">{b.name}</h3>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-3">
                  <span className="text-muted-foreground line-through text-sm">{b.originalPrice}</span>
                  <span className="font-display text-4xl font-bold text-emerald-400">{b.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>

                {/* Savings badge */}
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <Zap size={10} /> {b.saving} off every month
                  </span>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {b.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-secondary-foreground">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={b.popular ? "default" : "outline"}
                  className="w-full rounded-xl"
                  disabled={loading(b.priceId)}
                  onClick={() => startCheckout(b.priceId)}
                >
                  {loading(b.priceId) ? <LoadingLabel /> : `Get ${b.name}`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDIVIDUAL PLANS ─────────────────────────── */}
      <section>
        <div className="container px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Individual <span className="text-gradient">Plans</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Just need search? Pick the tier that fits your needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {individualPlans.map((plan) => (
              <div
                key={plan.name}
                className="group rounded-2xl p-8 flex flex-col glass transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20"
              >
                <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-secondary-foreground">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={loading(plan.priceId)}
                  onClick={() => {
                    if (!plan.priceId) {
                      toast({ title: "Free plan", description: "You're already on the Free plan!" });
                      return;
                    }
                    startCheckout(plan.priceId);
                  }}
                >
                  {loading(plan.priceId) ? <LoadingLabel /> : plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELLER PLANS ──────────────────────────────── */}
      <section className="pb-24">
        <div className="container px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              For Parts <span className="text-gradient">Sellers</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              List your parts on PARTARA and reach thousands of buyers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {sellerPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`group relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    plan.popular ? "glass glow-red border-primary/50" : "glass hover:border-primary/20"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full bg-primary text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={20} className="text-primary" />
                    <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-secondary-foreground">
                        <Check size={16} className="text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full rounded-xl"
                    disabled={loading(plan.priceId)}
                    onClick={() => startCheckout(plan.priceId)}
                  >
                    {loading(plan.priceId) ? <LoadingLabel /> : plan.cta}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingSection;
