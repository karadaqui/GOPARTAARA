import { Suspense, lazy, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LiveActivityCounter from "@/components/LiveActivityCounter";
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
import ExitIntentPopup from "@/components/ExitIntentPopup";
import FeaturedPartsSection from "@/components/FeaturedPartsSection";
import FeaturedSupplierSpotlight from "@/components/FeaturedSupplierSpotlight";

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
      <LiveActivityCounter />

      <FeaturedPartsSection />


      {/* Live social proof ticker */}
      <div
        aria-label="Live activity ticker"
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          padding: "8px 0",
        }}
      >
        <style>{`
          @keyframes gp-ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .gp-ticker-track {
            display: inline-flex;
            white-space: nowrap;
            animation: gp-ticker-scroll 60s linear infinite;
            will-change: transform;
          }
          .gp-ticker-track:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) {
            .gp-ticker-track { animation: none; }
          }
        `}</style>
        <div style={{ width: "100%", overflow: "hidden" }}>
          <div className="gp-ticker-track">
            {Array.from({ length: 2 }).map((_, dup) => (
              <div key={dup} style={{ display: "inline-flex", alignItems: "center" }}>
                {[
                  "🔍 Someone in Manchester just found brake pads for £38 less",
                  "⚡ 653,750 results for BMW parts",
                  "💰 Average saving today: £43",
                  "🛞 205/55 R16 tyres compared across 5 suppliers",
                  "🔧 Ford Focus clutch kit — 12 results found",
                  "⭐ 7 trusted suppliers checked simultaneously",
                  "🏆 1,000,000+ parts searchable right now",
                ].map((msg, i) => (
                  <span
                    key={`${dup}-${i}`}
                    style={{
                      color: "#a1a1aa",
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "0 28px",
                      borderRight: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {msg}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionDivider />
      <PopularSearchesStrip />
      <SectionDivider />

      {/* The GoPartara Guarantee */}
      <section
        className="px-4 py-8"
        style={{
          background: "rgba(0,182,122,0.04)",
          borderLeft: "3px solid #00b67a",
          borderTop: "1px solid rgba(0,182,122,0.15)",
          borderBottom: "1px solid rgba(0,182,122,0.15)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span aria-hidden="true" style={{ fontSize: 22 }}>🛡️</span>
            <h2
              className="font-display"
              style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              The GoPartara Guarantee
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { icon: "✅", label: "Free to Search — Always" },
              { icon: "🔒", label: "Secure & Private" },
              { icon: "💰", label: "Real Prices, No Markup" },
              { icon: "⚡", label: "Live Data from 7 Suppliers" },
            ].map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(0,182,122,0.35)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 14px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* As Seen In — Press & Media (placeholder) */}
      <section
        className="px-4 py-12"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p
            style={{
              fontSize: 11,
              color: "#cc1111",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Press &amp; Media
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              marginBottom: 28,
            }}
          >
            As seen in
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {["Autocar", "Top Gear", "Evo Magazine", "Car Throttle", "Auto Express"].map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    height: 64,
                    color: "#a1a1aa",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    opacity: 0.4,
                  }}
                >
                  {name}
                </div>
              )
            )}
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#52525b",
              marginTop: 20,
            }}
          >
            Media enquiries: press@gopartara.com
          </p>
        </div>
      </section>

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

        {/* See it in action — video placeholder */}
        <section className="px-4 py-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ color: "#fafafa", marginBottom: "8px" }}
            >
              See GOPARTARA in action
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#a1a1aa",
                marginBottom: "24px",
              }}
            >
              Watch how we find the cheapest car part in under 30 seconds
            </p>

            <div
              style={{
                maxWidth: "800px",
                margin: "0 auto",
                aspectRatio: "16 / 9",
                background:
                  "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                  marginBottom: "16px",
                }}
                aria-hidden="true"
              >
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "14px solid transparent",
                    borderBottom: "14px solid transparent",
                    borderLeft: "22px solid #0a0a0a",
                    marginLeft: "6px",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#a1a1aa",
                  margin: 0,
                }}
              >
                Coming soon — full demo video
              </p>
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "#71717a",
                marginTop: "16px",
              }}
            >
              In the meantime, try a live search above →
            </p>
          </div>
        </section>

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

      {/* Trustpilot trust section (early stage) */}
      <section
        className="px-4 py-10"
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

      <SectionDivider />

      <ScrollReveal><HomeCTASection /></ScrollReveal>

      <HomeShareRow />

      {/* Live stats bar (above footer) */}
      <section
        aria-label="Live platform stats"
        className="px-4 py-8"
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { value: "653,750+", label: "Parts compared today" },
              { value: "£43", label: "Average saving per search" },
              { value: "7", label: "Live suppliers right now" },
              { value: "2 min", label: "Average search time" },
            ].map((s) => (
              <div key={s.label} className="text-center px-4 py-4">
                <p
                  className="font-display"
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section
        aria-label="Why GOPARTARA beats the rest"
        style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-8">
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#cc1111",
                marginBottom: 8,
              }}
            >
              Comparison
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(22px, 2.6vw, 30px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              Why GOPARTARA beats the rest
            </h2>
          </div>

          <div
            style={{
              background: "#111111",
              border: "1px solid #27272a",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                  color: "#e4e4e7",
                  minWidth: 560,
                }}
              >
                <thead>
                  <tr style={{ background: "#0f0f0f" }}>
                    {["Feature", "GOPARTARA", "CarPartsCompare", "WhatPart"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i === 0 ? "left" : "center",
                          padding: "14px 16px",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: i === 1 ? "#ffffff" : "#a1a1aa",
                          background: i === 1 ? "#cc1111" : undefined,
                          borderBottom: "1px solid #27272a",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Suppliers checked simultaneously", gp: "7 ✅", cpc: "1 ❌", wp: "1 ❌" },
                    { feature: "UK Reg Plate search", gp: "✅", cpc: "❌", wp: "✅" },
                    { feature: "Photo search", gp: "✅", cpc: "❌", wp: "❌" },
                    { feature: "Tyre comparison", gp: "✅", cpc: "❌", wp: "❌" },
                    { feature: "P2P Marketplace", gp: "✅", cpc: "❌", wp: "❌" },
                    { feature: "Price alerts", gp: "✅", cpc: "❌", wp: "❌" },
                    { feature: "Always free", gp: "✅", cpc: "✅", wp: "✅" },
                  ].map((row, idx) => (
                    <tr key={row.feature} style={{ borderTop: idx === 0 ? "none" : "1px solid #1f1f1f" }}>
                      <td style={{ padding: "13px 16px", color: "#e4e4e7", fontWeight: 500 }}>
                        {row.feature}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          textAlign: "center",
                          background: "rgba(204,17,17,0.08)",
                          color: "#ffffff",
                          fontWeight: 700,
                        }}
                      >
                        {row.gp}
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", color: "#a1a1aa" }}>
                        {row.cpc}
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", color: "#a1a1aa" }}>
                        {row.wp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ color: "#52525b", fontSize: 11, marginTop: 12, textAlign: "center" }}>
            Comparison based on publicly available features at time of writing.
          </p>
        </div>
      </section>

      {/* Newsletter signup */}
      <NewsletterSignup />

      <Footer />
      <BackToTop />
      <WelcomeModal />
      <LocationBanner />
      <ExitIntentBanner />
      <ExitIntentPopup />
    </div>
  );
};

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section
      aria-label="Newsletter signup"
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderLeft: "3px solid #cc1111",
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 10 }} aria-hidden>
          📧
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(20px, 2.4vw, 26px)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            marginBottom: 8,
          }}
        >
          Get the best car parts deals in your inbox
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 20 }}>
          Weekly deals digest · Price drop alerts · No spam, ever
        </p>

        {submitted ? (
          <div
            role="status"
            style={{
              display: "inline-block",
              background: "rgba(22,163,74,0.12)",
              border: "1px solid rgba(22,163,74,0.4)",
              color: "#86efac",
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ✅ You're in! Check your inbox soon.
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 outline-none"
              style={{
                background: "#111111",
                border: "1px solid #27272a",
                borderRadius: 12,
                padding: "11px 14px",
                fontSize: 14,
                color: "#ffffff",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#cc1111",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                padding: "11px 20px",
                borderRadius: 12,
                whiteSpace: "nowrap",
              }}
            >
              Subscribe Free →
            </button>
          </form>
        )}

        <p style={{ color: "#52525b", fontSize: 12, marginTop: 14 }}>
          Join drivers already saving money. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default Index;
