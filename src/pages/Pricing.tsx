import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import SellerPricingSection from "@/components/SellerPricingSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-16">
      <PricingSection />
      <SellerPricingSection />
    </div>
    <Footer />
  </div>
);

export default Pricing;
