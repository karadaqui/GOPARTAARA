import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/home/StatsBar";
import HowItWorksBig from "@/components/home/HowItWorksBig";
import LiveSuppliers from "@/components/home/LiveSuppliers";
import MarketplaceCTA from "@/components/home/MarketplaceCTA";
import PopularSearchesStrip from "@/components/PopularSearchesStrip";
import BrowseByMakeSection from "@/components/BrowseByMakeSection";
import Footer from "@/components/Footer";
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
                "logo": { "@type": "ImageObject", "url": "https://gopartara.com/logo.png" },
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
      />
      <Navbar />
      <HeroSection />

      <StatsBar />

      <HowItWorksBig />

      <LiveSuppliers />

      <PopularSearchesStrip />

      <BrowseByMakeSection />

      <MarketplaceCTA />

      {/* Deals & Savings — clean CTA strip */}
      <Link
        to="/deals"
        className="deals-strip group"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0f0f0f",
          borderTop: "1px solid #1a1a1a",
          borderBottom: "1px solid #1a1a1a",
          padding: "18px 24px",
          margin: "48px 0 0",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: 500,
            color: "#cccccc",
          }}
        >
          Today's best deals from eBay &amp; Amazon
        </span>
        <span
          className="group-hover:translate-x-0.5 transition-transform"
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: 600,
            color: "#cc1111",
          }}
        >
          View deals →
        </span>
      </Link>

      <Footer />
      <BackToTop />
      <WelcomeModal />
      <LocationBanner />
      <ExitIntentBanner />
    </div>
  );
};

export default Index;
