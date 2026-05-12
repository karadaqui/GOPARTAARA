import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SectionDivider from "@/components/SectionDivider";

// Below-the-fold: lazy-load to keep initial JS small and defer their data fetches
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const WhyPartaraSection = lazy(() => import("@/components/WhyPartaraSection"));

import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import WelcomeModal from "@/components/WelcomeModal";
import LocationBanner from "@/components/LocationBanner";
import ExitIntentBanner from "@/components/ExitIntentBanner";
import ExitIntentPopup from "@/components/ExitIntentPopup";


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
        description="Search and compare car parts prices from 14 global suppliers simultaneously. Free to use. No account needed. Find brake pads, filters, tyres and more — shipped worldwide."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://gopartara.com/#website",
              "url": "https://gopartara.com",
              "name": "GOPARTARA",
              "description": "Search and compare car parts prices from 14 global suppliers simultaneously.",
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

      {/* Trust Bar */}
      <section
        aria-label="Trust bar"
        className="bg-[#0a0a0a]"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
            {[
              { icon: "🏢", text: "Partara Ltd · Registered in England & Wales" },
              { icon: "🔍", text: "1,000,000+ Parts" },
              { icon: "🌍", text: "14 Global Suppliers" },
              { icon: "🔒", text: "Free & Secure" },
              {
                icon: "⭐",
                text: "Rated on Trustpilot",
                href: "https://www.trustpilot.com/review/gopartara.com",
              },
            ].map((item, idx, arr) => {
              const inner = (
                <span style={{ color: "#d4d4d8", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center" }}>
                  <span aria-hidden="true" className="gp-trust-icon">{item.icon}</span>
                  {item.text}
                </span>
              );
              return (
                <div key={item.text} className="flex items-center gap-x-6">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                  {idx < arr.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 1,
                        height: 16,
                        background: "rgba(255,255,255,0.12)",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-32" />}>
        <SectionDivider />
        <ScrollReveal><HowItWorksSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><FeaturesSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><WhyPartaraSection /></ScrollReveal>
        <SectionDivider />
        <ScrollReveal><PricingSection /></ScrollReveal>
      </Suspense>

      <SectionDivider />

      {/* Trustpilot trust section (early stage) */}
      <section
        className="bg-[#0a0a0a] px-4 py-10"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded"
            style={{ background: "#00b67a", color: "#ffffff", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}
          >
            <span aria-hidden="true">★</span>
            <span>Trustpilot</span>
          </div>

          <div
            aria-label="5 out of 5 stars"
            className="flex items-center justify-center gap-1 mb-3"
            style={{ color: "#00b67a", fontSize: 28, lineHeight: 1 }}
          >
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>

          <p style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Leave us a review on Trustpilot
          </p>
          <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 6 }}>
            We're brand new — be one of our first reviewers and help us grow!
          </p>
          <p style={{ color: "#71717a", fontSize: 12, marginBottom: 18, fontStyle: "italic" }}>
            Every review helps us improve and reach more drivers.
          </p>

          <a
            href="https://www.trustpilot.com/review/gopartara.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{
              background: "#00b67a",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Review GOPARTARA →
          </a>
        </div>
      </section>

      <Footer />
      <BackToTop />
      <WelcomeModal />
      <LocationBanner />
      <ExitIntentBanner />
      <ExitIntentPopup />
    </div>
  );
};


export default Index;
