import { Suspense, lazy, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

// Below-the-fold: lazy-load to keep initial JS small and defer their data fetches
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));

import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import WelcomeModal from "@/components/WelcomeModal";
import LocationBanner from "@/components/LocationBanner";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string })?.scrollTo;
    if (scrollTo) {
      setTimeout(() => {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="GOPARTARA — Compare Car Parts Prices UK | 1M+ Parts"
        description="Find and compare car parts prices from trusted UK & global suppliers. Search 1,000,000+ parts, compare prices, and save money instantly. Free to use."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "GOPARTARA",
          "url": "https://gopartara.com",
          "description": "Compare prices on over 1M+ car parts from trusted UK & Global suppliers.",
          "applicationCategory": "AutomotiveApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "GBP"
          }
        }}
      />
      <Navbar />
      <HeroSection />

      <Link
        to="/deals"
        className="flex items-center justify-between px-5 py-3 mx-4 mb-6 max-w-4xl md:mx-auto bg-gradient-to-r from-card to-card/50 border border-border/60 rounded-2xl hover:border-border transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl animate-pulse">🔥</span>
          <div>
            <p className="text-foreground text-sm font-bold">Deals &amp; Savings</p>
            <p className="text-muted-foreground text-xs">
              eBay · Amazon · Classic Parts — Updated daily
            </p>
          </div>
        </div>
        <span className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all text-sm">
          View deals →
        </span>
      </Link>

      <Suspense fallback={<div className="h-32" />}>
        <HowItWorksSection />
        <TestimonialsSection />
        <FeaturesSection />
        <PricingSection />
      </Suspense>

      <Footer />
      <BackToTop />
      <WelcomeModal />
      <LocationBanner />
    </div>
  );
};

export default Index;
