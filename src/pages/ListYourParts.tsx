import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Store, Loader2, Sparkles, Zap, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

/* ── Stripe Price IDs ─────────────────────────────────── */

const STRIPE = {
  basic_seller: "price_1TKUmsAc5QcTT3aLrLoieucV",
  featured_seller: "price_1TKUnQAc5QcTT3aLAHq0CpaN",
  pro_seller: "price_1TKUo4Ac5QcTT3aLU2WNxx5F",
  pro_basic_seller: "price_1TKaEgAc5QcTT3aLnsB1kD4Y",
  pro_featured_seller: "price_1TKaEiAc5QcTT3aLx8pv4fRW",
  pro_pro_seller: "price_1TKaEjAc5QcTT3aLXOC91pWE",
  elite_basic_seller: "price_1TKaEjAc5QcTT3aL7rqOeGDF",
  elite_featured_seller: "price_1TKaEkAc5QcTT3aLrEa0prdA",
  elite_pro_seller: "price_1TKaEpAc5QcTT3aLCtIpVhmG",
};

/* ── Plan Data ────────────────────────────────────────── */

const bundles = [
  {
    name: "Pro + Basic Seller",
    price: "£16.99",
    was: "£19.98",
    period: "/mo",
    priceId: STRIPE.pro_basic_seller,
    popular: false,
    icon: Store,
    features: ["Unlimited searches", "Photo search", "Price alerts", "20 listings", "Basic analytics"],
  },
  {
    name: "Pro + Featured Seller",
    price: "£29.99",
    was: "£34.98",
    period: "/mo",
    priceId: STRIPE.pro_featured_seller,
    popular: true,
    icon: Star,
    features: ["Unlimited searches", "Photo search", "Price alerts", "100 listings", "Featured placement", "Advanced analytics"],
  },
  {
    name: "Pro + Pro Seller",
    price: "£49.99",
    was: "£59.98",
    period: "/mo",
    priceId: STRIPE.pro_pro_seller,
    popular: false,
    icon: Crown,
    features: ["Unlimited searches", "Photo search", "Price alerts", "Unlimited listings", "Top placement", "Verified badge"],
  },
  {
    name: "Elite + Basic Seller",
    price: "£25.99",
    was: "£29.98",
    period: "/mo",
    priceId: STRIPE.elite_basic_seller,
    popular: false,
    icon: Gem,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "Vehicle notes", "20 listings"],
  },
  {
    name: "Elite + Featured Seller",
    price: "£37.99",
    was: "£44.98",
    period: "/mo",
    priceId: STRIPE.elite_featured_seller,
    popular: false,
    icon: Gem,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "100 listings", "Featured placement"],
  },
  {
    name: "Elite + Pro Seller",
    price: "£57.99",
    was: "£69.98",
    period: "/mo",
    priceId: STRIPE.elite_pro_seller,
    popular: false,
    icon: Gem,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "Unlimited listings", "Top placement"],
  },
];

const sellerPlans = [
  {
    name: "Basic Seller",
    price: "£9.99",
    period: "/mo",
    priceId: STRIPE.basic_seller,
    popular: false,
    icon: Store,
    description: "Get listed in the PARTARA marketplace",
    features: ["20 listings", "Basic analytics"],
  },
  {
    name: "Featured Seller",
    price: "£24.99",
    period: "/mo",
    priceId: STRIPE.featured_seller,
    popular: true,
    icon: Star,
    description: "Stand out with premium placement",
    features: ["100 listings", "Featured placement", "Advanced analytics"],
  },
  {
    name: "Pro Seller",
    price: "£49.99",
    period: "/mo",
    priceId: STRIPE.pro_seller,
    popular: false,
    icon: Crown,
    description: "Maximum visibility for your business",
    features: ["Unlimited listings", "Top placement", "Verified badge"],
  },
];

const SELLER_PLANS = ["basic_seller", "featured_seller", "pro_seller", "admin"];
const CHECKOUT_TIMEOUT_MS = 10_000;

/* ── Component ────────────────────────────────────────── */

const ListYourParts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // Redirect existing sellers to /my-market
  useEffect(() => {
    if (!user) { setCheckingPlan(false); return; }
    supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data && SELLER_PLANS.includes(data.subscription_plan)) {
          navigate("/my-market", { replace: true });
        } else {
          setCheckingPlan(false);
        }
      });
  }, [user, navigate]);

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

  const isLoading = (id: string) => loadingId === id;

  if (checkingPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="List Your Parts | PARTARA"
        description="Sell your car parts on PARTARA. Reach thousands of UK buyers searching for parts daily. Choose from seller plans or bundle with Pro/Elite and save."
        path="/list-your-parts"
      />
      <Navbar />

      <div className="container max-w-6xl py-20 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            List Your Parts on <span className="text-primary">PARTARA</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Reach thousands of car owners and mechanics searching for parts every day. Subscribe and start selling instantly.
          </p>
        </div>

        {/* ── Section 1: Bundle Plans ──────────────────── */}
        <section className="mb-20">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
              <Sparkles size={14} /> Best Value
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Individual + Seller <span className="text-primary">Bundles</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Search + sell in one subscription. Save up to £12/mo.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.priceId}
                  className={`relative glass rounded-2xl p-6 flex flex-col transition-all hover:border-primary/30 ${
                    plan.popular ? "ring-2 ring-primary/40 glow-red" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={20} className="text-primary" />
                    <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                  </div>
                  <div className="mb-4">
                    <span className="font-display text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                    <span className="ml-2 text-muted-foreground/60 line-through text-sm">{plan.was}</span>
                  </div>
                  <ul className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-secondary-foreground">
                        <Check size={14} className="text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => startCheckout(plan.priceId)}
                    disabled={isLoading(plan.priceId)}
                    className="w-full rounded-xl"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {isLoading(plan.priceId) ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {slowWarning ? "Taking longer than expected…" : "Redirecting…"}
                      </span>
                    ) : !user ? "Sign in to Subscribe" : "Subscribe Now"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 2: Seller-Only Plans ─────────────── */}
        <section>
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary text-foreground text-sm font-medium">
              <Store size={14} /> Seller Only
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Seller-Only <span className="text-primary">Plans</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Already have a buyer plan? Add a seller subscription separately.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {sellerPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.priceId}
                  className={`relative glass rounded-2xl p-6 flex flex-col transition-all hover:border-primary/30 ${
                    plan.popular ? "ring-2 ring-primary/40 glow-red" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                      Most Popular
                    </Badge>
                  )}
                  <Icon size={24} className="text-primary mb-3" />
                  <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-5">
                    <span className="font-display text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-secondary-foreground">
                        <Check size={14} className="text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => startCheckout(plan.priceId)}
                    disabled={isLoading(plan.priceId)}
                    className="w-full rounded-xl"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {isLoading(plan.priceId) ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {slowWarning ? "Taking longer than expected…" : "Redirecting…"}
                      </span>
                    ) : !user ? "Sign in to Subscribe" : plan.popular ? "Go Featured" : "Subscribe"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default ListYourParts;
