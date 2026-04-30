import { Suspense, lazy, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofStats from "@/components/SocialProofStats";
import HomeCTASection from "@/components/HomeCTASection";
import PopularSearchesStrip from "@/components/PopularSearchesStrip";
import BrowseByMakeSection from "@/components/BrowseByMakeSection";
import FeaturedListingsSection from "@/components/FeaturedListingsSection";
import SectionDivider from "@/components/SectionDivider";

import LiveActivityStrip from "@/components/LiveActivityStrip";
import GuaranteesBar from "@/components/GuaranteesBar";

import HomeShareRow from "@/components/HomeShareRow";

// Below-the-fold: lazy-load
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const WhyPartaraSection = lazy(() => import("@/components/WhyPartaraSection"));

import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import WelcomeModal from "@/components/WelcomeModal";
import LocationBanner from "@/components/LocationBanner";
import ExitIntentBanner from "@/components/ExitIntentBanner";

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title="GOPARTARA — Compare Car Parts Prices | Search 1M+ Parts Free"
        description="Search and compare car parts prices from 7 trusted global suppliers simultaneously. Free to use. No account needed. Find brake pads, filters, tyres and more — shipped worldwide."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://gopartara.com/#website",
              "url": "https://gopartara.com",
              "name": "GOPARTARA",
              "description": "Search and compare car parts prices from 7 trusted global suppliers simultaneously.",
              "publisher": {
                "@type": "Organization",
                "name": "GOPARTARA Ltd",
                "url": "https://gopartara.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://gopartara.com/logo.png",
                },
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://gopartara.com/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }}
        additionalJsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "GOPARTARA",
            "url": "https://gopartara.com",
            "description": "Compare prices on over 1,000,000 car parts from trusted global suppliers. Always free.",
            "applicationCategory": "AutomotiveApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "GBP",
            },
          },
        ]}
      />

      <Navbar />
      <HeroSection />

      {/* Stats bar (navy gradient) directly below hero */}
      <SocialProofStats />

      {/* Live activity strip (light green) */}
      <LiveActivityStrip />

      <PopularSearchesStrip />
      <SectionDivider />
      <FeaturedListingsSection />
      <BrowseByMakeSection />
      <SectionDivider />

      <Link
        to="/deals"
        className="flex items-center justify-between px-5 py-3 mx-4 mb-6 max-w-4xl md:mx-auto rounded-2xl transition-colors group"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Deals &amp; Savings</p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              eBay · Amazon · Classic Parts — Updated daily
            </p>
          </div>
        </div>
        <span
          className="group-hover:translate-x-0.5 transition-transform text-sm font-bold"
          style={{ color: "#0a1628" }}
        >
          View deals →
        </span>
      </Link>

      <Suspense fallback={<div className="h-32" />}>
        <ScrollReveal><HowItWorksSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><FeaturesSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><WhyPartaraSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><TestimonialsSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><PricingSection /></ScrollReveal>
      </Suspense>

      <GuaranteesBar />

      <ScrollReveal><HomeCTASection /></ScrollReveal>

      <HomeShareRow />

      <Footer />
      <BackToTop />
      <WelcomeModal />
      <LocationBanner />
      <ExitIntentBanner />
    </div>
  );
};

export default Index;
