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
        toast.success('1 month Pro activated!');
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
        toast.success('1 month Pro activated!');
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
        title="Pricing Plans — Free, Pro & Elite | GOPARTARA"
        description="GOPARTARA is free to use. Upgrade to Pro (£9.99/mo) for unlimited searches and photo search, or Elite (£19.99/mo) for bulk compare and garage analytics."
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "GOPARTARA Pro",
          "description": "Unlimited car parts searches, photo search, unlimited marketplace listings and more.",
          "brand": {
            "@type": "Brand",
            "name": "GOPARTARA",
          },
          "offers": [
            {
              "@type": "Offer",
              "name": "Free Plan",
              "price": "0",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/InStock",
              "url": "https://gopartara.com/pricing",
            },
            {
              "@type": "Offer",
              "name": "Pro Plan",
              "price": "9.99",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/InStock",
              "url": "https://gopartara.com/pricing",
            },
            {
              "@type": "Offer",
              "name": "Elite Plan",
              "price": "19.99",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/InStock",
              "url": "https://gopartara.com/pricing",
            },
          ],
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

        {/* Enterprise & Trade */}
        <section className="container max-w-5xl mx-auto px-4 pb-12">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#111111",
              border: "1px solid rgba(204,17,17,0.35)",
              boxShadow: "0 0 0 1px rgba(251,191,36,0.08) inset",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-10">
              {/* Left */}
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#cc1111",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Enterprise &amp; Trade
                </p>
                <h3
                  className="font-display"
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.15,
                    marginBottom: 18,
                  }}
                >
                  For garages, fleets &amp; dealerships
                </h3>
                <ul className="space-y-2">
                  {[
                    "Unlimited everything",
                    "Team management & roles",
                    "API access",
                    "Custom integrations",
                    "Dedicated account manager",
                    "Volume pricing",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: "#e4e4e7", fontSize: 14 }}
                    >
                      <span style={{ color: "#fbbf24", fontWeight: 800 }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right */}
              <div className="flex flex-col justify-center md:items-end md:text-right">
                <p
                  className="font-display"
                  style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}
                >
                  Custom pricing
                </p>
                <p style={{ color: "#a1a1aa", fontSize: 14, marginTop: 8, marginBottom: 20 }}>
                  Contact us for a tailored quote
                </p>
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-[#cc1111] hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    Talk to Us →
                  </Link>
                  <a
                    href="mailto:info@gopartara.com?subject=Demo%20Request"
                    className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    Schedule a Demo →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

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
            Got a secret code?
          </p>
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Try COMMUNITY"
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
