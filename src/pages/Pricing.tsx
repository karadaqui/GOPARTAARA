import { useState } from "react";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { supabase } from "@/integrations/supabase/client";
import { activateTrial } from "@/utils/activateTrial";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Pricing = () => {
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    const result = await activateTrial(supabase, promoCode.trim());
    setPromoLoading(false);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing | PARTARA"
        description="Compare PARTARA plans — Free, Pro, and Elite. Bundle with seller plans and save. Search 1,000,000+ parts from trusted UK &amp; global suppliers."
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

        {/* Promo code section */}
        <div className="max-w-md mx-auto px-4 pb-12">
          <p className="text-sm text-muted-foreground mb-2 text-center">
            Have a promo code?
          </p>
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="e.g. COMMUNITY"
              className="flex-1 bg-zinc-800 border-zinc-700 text-foreground uppercase"
            />
            <Button
              onClick={handlePromo}
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
