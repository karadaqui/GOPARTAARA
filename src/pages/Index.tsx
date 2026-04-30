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

import HomeShareRow from "@/components/HomeShareRow";

// Below-the-fold: lazy-load to keep initial JS small and defer their data fetches
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
        title="GOPARTARA — Compare Car Parts Prices UK | Search 1M+ Parts Free"
        description="Search and compare car parts prices from 7 trusted UK & global suppliers simultaneously. Free to use. No account needed. Find brake pads, filters, tyres and more instantly."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://gopartara.com/#website",
              "url": "https://gopartara.com",
              "name": "GOPARTARA",
              "description": "Search and compare car parts prices from 7 UK & global suppliers simultaneously.",
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
            "description": "Compare prices on over 1M+ car parts from trusted UK & Global suppliers.",
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
      <SectionDivider />
      <PopularSearchesStrip />
      <SectionDivider />
      <FeaturedListingsSection />
      <BrowseByMakeSection />
      <SectionDivider />
      <SocialProofStats />
      <SectionDivider />

      {/* Trust bar */}
      <section className="px-4 mb-8 mt-2">
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ fontSize: "12px", color: "#52525b", margin: "8px 0", textAlign: "center" }}>
            Trusted by drivers worldwide.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {[
              "UK's Most Comprehensive Parts Search",
              "SSL Secured · No Credit Card Required",
              "Live data from 7 verified suppliers",
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#52525b",
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Link
        to="/deals"
        className="flex items-center justify-between px-5 py-3 mx-4 mb-6 max-w-4xl md:mx-auto rounded-2xl transition-colors group"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-foreground text-sm font-bold">Deals &amp; Savings</p>
            <p className="text-muted-foreground text-xs">
              eBay · Amazon · Classic Parts — Updated daily
            </p>
          </div>
        </div>
        <span className="group-hover:translate-x-0.5 transition-transform text-sm font-semibold" style={{ color: "#cc1111" }}>
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

      <SectionDivider />

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
