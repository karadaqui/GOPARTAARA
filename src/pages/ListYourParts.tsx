import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const tiers = [
  {
    plan: "Free",
    listings: "5 listings",
    features: ["Basic listing details", "Photo uploads (3 per listing)", "Marketplace visibility"],
  },
  {
    plan: "Pro",
    listings: "Unlimited listings",
    features: ["10 photos per listing", "Featured placement eligible", "Boost packages available"],
  },
  {
    plan: "Elite",
    listings: "Unlimited listings",
    features: ["10 photos per listing", "Analytics dashboard", "Priority support", "Boost packages available"],
  },
];

const ListYourParts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="List Your Parts — Free | GOPARTARA"
        description="Sell your car parts on GOPARTARA for free. Reach thousands of UK buyers. Free members get 5 listings, Pro and Elite get unlimited."
        path="/list-your-parts"
      />
      <Navbar />

      <div className="container max-w-3xl pt-24 pb-20 px-4 mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            List Your Parts on <span className="text-primary">PARTARA</span> — It's Free
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Reach thousands of UK car owners and mechanics.
            Free members can list up to 5 parts.
            Pro and Elite members get unlimited listings.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Plan</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Listings</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Features</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.plan} className="border-b border-border/20">
                  <td className="py-4 px-4 font-medium text-foreground">{t.plan}</td>
                  <td className="py-4 px-4 text-muted-foreground">{t.listings}</td>
                  <td className="py-4 px-4">
                    <ul className="space-y-1">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-secondary-foreground">
                          <Check size={14} className="text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="rounded-xl h-12 px-8 text-base font-medium"
            onClick={() => navigate(user ? "/my-market" : "/auth")}
          >
            Start Listing Now <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default ListYourParts;
