import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PricingSection, { faqItems } from "@/components/PricingSection";
import { TestimonialCard, testimonials } from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Pricing = () => {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);

    try {
      const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
      if (!raw) {
        toast.error('Please sign in first');
        setPromoLoading(false);
        return;
      }

      const token = JSON.parse(raw)?.access_token;

      const response = await fetch(
        'https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ promoCode: promoCode.trim().toUpperCase() }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('🎉 1 month Pro activated!');
        setTimeout(() => window.location.reload(), 1500);
      } else if (result.already_used) {
        toast.success(result.message);
      } else if (result.error === 'Invalid promo code') {
        toast.error('Invalid promo code');
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    }

    setPromoLoading(false);
  };

  const handleStartFree = async () => {
    try {
      const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
      if (!raw) { navigate('/auth'); return; }
      const token = JSON.parse(raw)?.access_token;

      const response = await fetch(
        'https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success('🎉 1 month Pro activated!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing Plans | GOPARTARA — First Month Free"
        description="Simple, transparent pricing for GOPARTARA. Free, Pro £9.99/mo, Elite £19.99/mo. Start with 10 free searches. No credit card needed."
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "GOPARTARA Pricing",
          "url": "https://gopartara.com/pricing",
          "description": "Compare GOPARTARA subscription plans for car parts search."
        }}
        additionalJsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map((item) => ({
              "@type": "Question",
              "name": item.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a,
              },
            })),
          },
        ]}
      />
      <Navbar />
      <div className="pt-24">
        <PricingSection />

        {/* What Pro users say */}
        <section className="container max-w-5xl mx-auto px-4 pb-12">
          <h3 className="font-display text-2xl font-bold text-center mb-2 tracking-tight">
            What Pro users say
          </h3>
          <p className="text-center text-sm mb-6" style={{ color: "#52525b" }}>
            Real feedback from drivers and mechanics on a paid plan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <TestimonialCard t={testimonials.find((t) => t.name === "Gary T.") || testimonials[0]} />
            <TestimonialCard t={testimonials.find((t) => t.name === "James B.") || testimonials[1]} />
          </div>
        </section>

        {/* Start Free CTA */}
        <div className="text-center pb-8">
          <Button onClick={handleStartFree} size="lg" className="rounded-full px-8">
            Claim Free Month →
          </Button>
        </div>

        {/* Promo code section */}
        <div className="max-w-md mx-auto px-4 pb-12">
          <p className="text-sm text-muted-foreground mb-2 text-center">
            Got a secret code? 👀
          </p>
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="🤫 psst... try COMMUNITY"
              className="flex-1 bg-zinc-800 border-zinc-700 text-foreground uppercase"
            />
            <Button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              size="sm"
            >
              {promoLoading ? "..." : "Apply"}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Pricing;
