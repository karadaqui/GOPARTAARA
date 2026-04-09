import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Crown, Star, Zap, Loader2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SELLER_TIERS = {
  basic: {
    name: "Basic Seller",
    price: "£9.99",
    period: "/month",
    icon: Store,
    description: "Get listed in the PARTARA supplier directory",
    features: ["Supplier directory listing", "Business profile page", "Customer enquiries", "Email support"],
    price_id: "price_1TJnPfAc5QcTT3aLxbMPfR2Z",
    popular: false,
  },
  featured: {
    name: "Featured Seller",
    price: "£24.99",
    period: "/month",
    icon: Star,
    description: "Stand out with highlighted listings and badges",
    features: ["Everything in Basic", "Highlighted listing", "Featured badge", "Priority placement", "Analytics dashboard"],
    price_id: "price_1TJnPqAc5QcTT3aLMoC5sivK",
    popular: true,
  },
  pro: {
    name: "Pro Seller",
    price: "£49.99",
    period: "/month",
    icon: Crown,
    description: "Maximum visibility and premium features",
    features: ["Everything in Featured", "Top placement", "Premium profile page", "Dedicated seller section", "Priority support", "API access"],
    price_id: "price_1TJnPrAc5QcTT3aLbuZ5g8in",
    popular: false,
  },
};

const SELLER_PLANS = ["basic_seller", "featured_seller", "pro_seller"];

const ListYourParts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    business_address: "",
    parts_description: "",
  });

  // Redirect seller plan users directly to /my-market
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier || !form.business_name || !form.contact_name || !form.contact_email || !form.parts_description) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Save application
      const { error } = await supabase.from("seller_applications").insert({
        user_id: user?.id || null,
        business_name: form.business_name,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone || null,
        business_address: form.business_address || null,
        parts_description: form.parts_description,
        tier: selectedTier,
      } as any);

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          recipientEmail: "info@gopartara.com",
          idempotencyKey: `seller-app-${Date.now()}`,
          templateData: {
            name: form.contact_name,
            email: form.contact_email,
            subject: `New Seller Application: ${SELLER_TIERS[selectedTier as keyof typeof SELLER_TIERS].name}`,
            message: `Business: ${form.business_name}\nTier: ${SELLER_TIERS[selectedTier as keyof typeof SELLER_TIERS].name}\nParts: ${form.parts_description}\nPhone: ${form.contact_phone || "N/A"}\nAddress: ${form.business_address || "N/A"}`,
          },
          reply_to: form.contact_email,
        },
      }).catch(() => {}); // Non-critical

      // Start Stripe checkout
      if (user) {
        const tier = SELLER_TIERS[selectedTier as keyof typeof SELLER_TIERS];
        const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
          body: { priceId: tier.price_id },
        });
        if (!checkoutError && data?.url) {
          window.open(data.url, "_blank");
        }
      }

      setSubmitted(true);
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-5xl py-20 px-4">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            List Your Parts on <span className="text-primary">PARTARA</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Reach thousands of car owners and mechanics searching for parts every day. Choose a plan that fits your business.
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {Object.entries(SELLER_TIERS).map(([key, tier]) => {
            const Icon = tier.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedTier(key)}
                className={`text-left rounded-2xl p-8 flex flex-col transition-all ${
                  selectedTier === key
                    ? "glass glow-red border-primary/50 ring-2 ring-primary/30"
                    : "glass hover:border-primary/20"
                } ${tier.popular ? "relative" : ""}`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full bg-primary text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <Icon size={24} className="text-primary mb-3" />
                <h3 className="font-display text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
                <ul className="flex-1 space-y-3 mb-4">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-secondary-foreground">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedTier === key && (
                  <span className="text-xs text-primary font-medium">✓ Selected</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="glass rounded-2xl p-8 mb-16 overflow-x-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Compare Plans</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-center py-3 px-4">Basic</th>
                <th className="text-center py-3 px-4">Featured</th>
                <th className="text-center py-3 px-4">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Directory listing", true, true, true],
                ["Business profile", true, true, true],
                ["Customer enquiries", true, true, true],
                ["Highlighted listing", false, true, true],
                ["Featured badge", false, true, true],
                ["Priority placement", false, true, true],
                ["Analytics dashboard", false, true, true],
                ["Top placement", false, false, true],
                ["Premium profile page", false, false, true],
                ["Dedicated section", false, false, true],
                ["API access", false, false, true],
              ].map(([feature, ...values]) => (
                <tr key={feature as string} className="border-b border-border/50">
                  <td className="py-3 px-4 text-muted-foreground">{feature as string}</td>
                  {(values as boolean[]).map((v, i) => (
                    <td key={i} className="text-center py-3 px-4">
                      {v ? <Check size={16} className="text-primary mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-3 px-4 font-medium">Price</td>
                <td className="text-center py-3 px-4 font-bold">£9.99/mo</td>
                <td className="text-center py-3 px-4 font-bold text-primary">£24.99/mo</td>
                <td className="text-center py-3 px-4 font-bold">£49.99/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Application form */}
        {submitted ? (
          <div className="glass rounded-2xl p-12 text-center max-w-xl mx-auto">
            <Zap size={48} className="text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              We'll review your application and get back to you within 24 hours. If you selected a plan, complete your payment to activate your listing.
            </p>
            <Button onClick={() => navigate("/")} className="rounded-xl">
              Back to Home
            </Button>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 max-w-xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-6 text-center">Apply to List Your Parts</h2>
            {!selectedTier && (
              <p className="text-center text-muted-foreground mb-6">↑ Select a plan above to continue</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Business Name *</label>
                <Input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="bg-secondary border-border rounded-xl"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Contact Name *</label>
                  <Input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="bg-secondary border-border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Contact Email *</label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="bg-secondary border-border rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Phone</label>
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="bg-secondary border-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Business Address</label>
                  <Input
                    value={form.business_address}
                    onChange={(e) => setForm({ ...form, business_address: e.target.value })}
                    className="bg-secondary border-border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Parts You Sell *</label>
                <Textarea
                  value={form.parts_description}
                  onChange={(e) => setForm({ ...form, parts_description: e.target.value })}
                  className="bg-secondary border-border rounded-xl min-h-[100px]"
                  placeholder="Describe the types of parts you sell, brands, vehicle makes/models..."
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl gap-2"
                disabled={!selectedTier || submitting}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
                {submitting ? "Submitting..." : !user ? "Sign in to Apply" : `Apply as ${selectedTier ? SELLER_TIERS[selectedTier as keyof typeof SELLER_TIERS].name : "..."}`}
              </Button>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  You'll need to <button type="button" onClick={() => navigate("/auth")} className="text-primary hover:underline">sign in</button> to submit your application.
                </p>
              )}
            </form>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ListYourParts;
