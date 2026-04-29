import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const EvCharging = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="EV Charging — Under Maintenance | GOPARTARA"
        description="Our EV charging accessories section is being wired up. Check back shortly."
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-8">
            <Zap className="w-10 h-10" style={{ color: "#cc1111" }} strokeWidth={2.5} />
          </div>

          <h1 className="ds-h1 mb-4">We're charging up this page.</h1>
          <p className="ds-body text-text-secondary mb-10">
            Our EV charging accessories section is being wired up. Check back shortly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/search" className="btn-ds-primary">
              Browse Parts
            </Link>
            <Link to="/deals" className="btn-ds-ghost">
              View Deals
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            EV King integration in progress
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EvCharging;
