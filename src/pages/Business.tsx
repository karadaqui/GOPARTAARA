import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";

const benefits = [
  { icon: "🔍", title: "Unlimited Searches", desc: "Search 1M+ parts across all suppliers with no monthly limits." },
  { icon: "👥", title: "Team Access", desc: "Multiple team members on one account. Perfect for busy workshops." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Track your searches, savings and parts history over time." },
  { icon: "💰", title: "Bulk Price Comparison", desc: "Compare prices across all suppliers at once. Always get the best deal." },
  { icon: "⚡", title: "Priority Support", desc: "Dedicated email support. We respond within 24 hours." },
  { icon: "🔧", title: "Custom Integration", desc: "API access for larger operations. Connect to your existing systems." },
];

const audiences = [
  { icon: "🏗️", label: "Independent Garages" },
  { icon: "🚗", label: "Car Dealerships" },
  { icon: "🚛", label: "Fleet Managers" },
  { icon: "🔧", label: "Mobile Mechanics" },
];

const Business = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="GOPARTARA for Business — Garages, Fleets & Trade"
        description="Custom plans for garages, dealerships and fleet managers. Unlimited searches, team access, analytics and priority support."
        path="/business"
      />
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="container max-w-4xl px-4 text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              For Business
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
            GOPARTARA <br />
            <span className="text-primary">for Garages &amp; Trade</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Custom plans for garages, dealerships, fleet managers and trade buyers.
            Save time and money on every parts order.
          </p>
          <a
            href="mailto:business@gopartara.com"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-2xl transition-all text-sm"
          >
            Get a Custom Quote →
          </a>
        </section>

        {/* Benefits */}
        <section className="container max-w-5xl px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="p-6 rounded-2xl border border-border bg-card/50 hover:border-border/80 transition-colors"
              >
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="container max-w-4xl px-4 mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
            Who It&apos;s For
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {audiences.map((w) => (
              <div
                key={w.label}
                className="flex flex-col items-center text-center p-5 rounded-2xl border border-border bg-card/50"
              >
                <div className="text-3xl mb-2">{w.icon}</div>
                <p className="text-sm font-semibold">{w.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container max-w-3xl px-4">
          <div className="text-center p-10 md:p-12 rounded-3xl border border-border bg-card/50">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-xl mx-auto leading-relaxed">
              Contact us and we&apos;ll put together a custom plan for your business within 24 hours.
            </p>
            <a
              href="mailto:business@gopartara.com"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-all text-sm"
            >
              Contact Us →
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              Or email us directly:{" "}
              <a
                href="mailto:business@gopartara.com"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                business@gopartara.com
              </a>
            </p>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to GOPARTARA
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Business;
