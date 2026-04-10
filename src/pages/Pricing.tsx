import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import SellerPricingSection from "@/components/SellerPricingSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Pricing | PARTARA"
      description="Compare PARTARA plans — Free, Pro, and Business. Search 1,000,000+ parts from trusted UK &amp; global suppliers."
      path="/pricing"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "PARTARA Pricing",
        "url": "https://car-part-search.lovable.app/pricing",
        "description": "Compare PARTARA subscription plans for car parts search."
      }}
    />
    <Navbar />
    <div className="pt-16">
      <PricingSection />
      <SellerPricingSection />
    </div>
    <Footer />
    <BackToTop />
  </div>
);

export default Pricing;
