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
    tagline: "Search & sell essentials",
    price: "£16.99",
    was: "£19.98",
    saving: "£3",
    period: "/mo",
    priceId: STRIPE.pro_basic_seller,
    popular: false,
    icon: Store,
    features: ["Unlimited searches", "Photo search", "Price alerts", "20 listings", "Basic analytics"],
  },
  {
    name: "Pro + Featured Seller",
    tagline: "The most popular combo",
    price: "£29.99",
    was: "£34.98",
    saving: "£5",
    period: "/mo",
    priceId: STRIPE.pro_featured_seller,
    popular: true,
    icon: Star,
    features: ["Unlimited searches", "Photo search", "Price alerts", "100 listings", "Featured placement", "Advanced analytics"],
  },
  {
    name: "Pro + Pro Seller",
    tagline: "Full power search & selling",
    price: "£49.99",
    was: "£59.98",
    saving: "£10",
    period: "/mo",
    priceId: STRIPE.pro_pro_seller,
    popular: false,
    icon: Crown,
    features: ["Unlimited searches", "Photo search", "Price alerts", "Unlimited listings", "Top placement", "Verified badge"],
  },
  {
    name: "Elite + Basic Seller",
    tagline: "Premium search with seller access",
    price: "£25.99",
    was: "£29.98",
    saving: "£4",
    period: "/mo",
    priceId: STRIPE.elite_basic_seller,
    popular: false,
    icon: Gem,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "Vehicle notes", "20 listings"],
  },
  {
    name: "Elite + Featured Seller",
    tagline: "Premium everything",
    price: "£37.99",
    was: "£44.98",
    saving: "£7",
    period: "/mo",
    priceId: STRIPE.elite_featured_seller,
    popular: false,
    icon: Gem,
    features: ["Everything in Pro", "CSV export", "30-day tracking", "100 listings", "Featured placement"],
  },
  {
    name: "Elite + Pro Seller",
    tagline: "The ultimate PARTARA plan",
    price: "£57.99",
    was: "£69.98",
    saving: "£12",
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
    tagline: "Get listed in the PARTARA marketplace",
    price: "£9.99",
    period: "/mo",
    priceId: STRIPE.basic_seller,
    popular: false,
    icon: Store,
    features: ["20 listings", "Basic analytics"],
    cta: "Get Started",
  },
  {
    name: "Featured Seller",
    tagline: "Stand out with premium placement",
    price: "£24.99",
    period: "/mo",
    priceId: STRIPE.featured_seller,
    popular: true,
    icon: Star,
    features: ["100 listings", "Featured placement", "Advanced analytics"],
    cta: "Go Featured",
  },
  {
    name: "Pro Seller",
    tagline: "Maximum visibility for your business",
    price: "£49.99",
    period: "/mo",
    priceId: STRIPE.pro_seller,
    popular: false,
    icon: Crown,
    features: ["Unlimited listings", "Top placement", "Verified badge"],
    cta: "Go Pro Seller",
  },
];

type Tab = "bundles" | "seller";

const SELLER_PLANS = ["basic_seller", "featured_seller", "pro_seller", "admin"];
const CHECKOUT_TIMEOUT_MS = 10_000;

/* ── Reusable Card ────────────────────────────────────── */

interface CardProps {
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular: boolean;
  loading: boolean;
  slowWarning: boolean;
  onSelect: () => void;
  was?: string;
  saving?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const PlanCard = ({ name, tagline, price, period, features, cta, popular, loading, slowWarning, onSelect, was, saving, icon: Icon }: CardProps) => (
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
    </div>
    <div className="flex items-baseline gap-1 mb-2">
      <span className="font-display text-5xl font-bold text-foreground tracking-tight">{price}</span>
      <span className="text-muted-foreground text-base">{period}</span>
    </div>
    {saving ? (
      <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
        <Zap size={10} /> Save {saving}/mo
      </span>
    ) : <div className="mb-6" />}
    <div className="h-px bg-border/40 mb-6" />
    <ul className="flex-1 space-y-3 mb-8">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-3 text-sm text-secondary-foreground">
          <Check size={16} className="text-primary shrink-0 mt-0.5" />
          {f}
        </li>
      ))}
    </ul>
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
  </div>
);

/* ── Component ────────────────────────────────────────── */

const ListYourParts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("bundles");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "bundles", label: "Bundle & Save" },
    { key: "seller", label: "Seller Only" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="List Your Parts | PARTARA"
        description="Sell your car parts on PARTARA. Reach thousands of UK buyers searching for parts daily. Choose from seller plans or bundle with Pro/Elite and save."
        path="/list-your-parts"
      />
      <Navbar />

      <div className="container max-w-5xl pt-24 pb-20 px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            List Your Parts on <span className="text-primary">PARTARA</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Reach thousands of car owners and mechanics searching for parts every day.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center rounded-xl border border-border/50 bg-card/50 p-1 backdrop-blur-sm">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.key === "bundles" && <Sparkles size={12} className="inline mr-1.5 -mt-0.5" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bundles */}
        {activeTab === "bundles" && (
          <div>
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Zap size={14} /> Save up to £12/mo with bundles
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {bundles.map((b) => (
                <PlanCard
                  key={b.priceId}
                  name={b.name}
                  tagline={b.tagline}
                  price={b.price}
                  period={b.period}
                  was={b.was}
                  saving={b.saving}
                  features={b.features}
                  cta={`Get ${b.name}`}
                  popular={b.popular}
                  loading={isLoading(b.priceId)}
                  slowWarning={slowWarning}
                  onSelect={() => startCheckout(b.priceId)}
                  icon={b.icon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Seller Only */}
        {activeTab === "seller" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {sellerPlans.map((plan) => (
              <PlanCard
                key={plan.priceId}
                name={plan.name}
                tagline={plan.tagline}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                cta={plan.cta}
                popular={plan.popular}
                loading={isLoading(plan.priceId)}
                slowWarning={slowWarning}
                onSelect={() => startCheckout(plan.priceId)}
                icon={plan.icon}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default ListYourParts;
