import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EbayDealsSection from "@/components/EbayDealsSection";
import AmazonDealsSection from "@/components/AmazonDealsSection";
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
      <EbayDealsSection />
      <AmazonDealsSection />
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
