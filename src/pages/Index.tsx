import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import CommunityBanner from "@/components/CommunityBanner";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import SuppliersSection from "@/components/SuppliersSection";

import PricingSection from "@/components/PricingSection";

import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import WelcomeModal from "@/components/WelcomeModal";
import LocationBanner from "@/components/LocationBanner";
import RecentlyViewed from "@/components/RecentlyViewed";

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
        title="GOPARTARA — Find Any Car Part Instantly | UK & Global Car Parts Search"
        description="Compare prices on over 1M+ car parts from trusted UK & Global suppliers. Search by part name, VIN, reg plate or photo. Free to use — find the right part fast."
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
      <CommunityBanner />

      <Link
        to="/deals"
        className="flex items-center justify-between px-5 py-3 mx-4 mb-6 max-w-4xl md:mx-auto bg-gradient-to-r from-card to-card/50 border border-border/60 rounded-2xl hover:border-border transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔥</span>
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

      <RecentlyViewed />
      <HowItWorksSection />
      <TestimonialsSection />
      <SuppliersSection />
      <FeaturesSection />
      <PricingSection />
      
      <Footer />
      <BackToTop />
      <WelcomeModal />
      <LocationBanner />
    </div>
  );
};

export default Index;
