import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
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
        title="Pricing Plans — GOPARTARA | First Month Free"
        description="Simple, transparent pricing for GOPARTARA. Free, Pro £9.99/mo, Elite £19.99/mo. Start with 10 free searches. No credit card needed."
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "PARTARA Pricing",
          "url": "https://gopartara.com/pricing",
          "description": "Compare PARTARA subscription plans for car parts search."
        }}
      />
      <Navbar />
      <div className="pt-24">
        <PricingSection />

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
