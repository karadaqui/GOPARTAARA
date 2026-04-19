import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import EbayDealsSection from "@/components/EbayDealsSection";
import GreenSparkSection from "@/components/GreenSparkSection";
import AmazonDealsSection from "@/components/AmazonDealsSection";

const Deals = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Deals & Savings — Curated UK Car Parts Deals | GOPARTARA"
        description="Browse curated affiliate deals from trusted UK automotive retailers — eBay UK, Amazon UK and classic car part specialists. Updated daily."
        path="/deals"
      />
      <Navbar />

      <main className="pt-20">
        <div className="text-center py-16 px-4">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">
            Updated Daily
          </p>
          <h1 className="text-4xl font-black text-foreground mb-3">
            Deals &amp; Savings
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Curated affiliate deals from trusted UK automotive retailers.
            New deals added regularly.
          </p>
        </div>

        <EbayDealsSection />
        <GreenSparkSection />
        <AmazonDealsSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Deals;
