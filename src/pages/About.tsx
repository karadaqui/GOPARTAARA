import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import {
  Search, Camera, Car, Bookmark, Bell, Store, Star, Shield,
  Users, Clock, TrendingUp, BarChart3, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Search,
    title: "Search",
    desc: "Type a part name, snap a photo, or enter your UK reg plate. We search 1,000,000+ parts from trusted suppliers in seconds.",
  },
  {
    icon: BarChart3,
    title: "Compare",
    desc: "See real-time prices, ratings, and availability side by side. Filter by price, supplier, or vehicle compatibility.",
  },
  {
    icon: ShoppingCart,
    title: "Save & Buy",
    desc: "Save parts for later, set price alerts, or buy directly from your chosen supplier. No middleman, no markup.",
  },
];

const features = [
  { icon: Car, title: "UK Plate Lookup", desc: "Enter your registration number to find parts specific to your exact vehicle via DVLA data." },
  { icon: Camera, title: "Photo Search", desc: "Upload a photo of any car part and we'll identify it and search for the best prices." },
  { icon: Store, title: "Marketplace", desc: "Browse verified UK seller listings with moderated quality checks on every part." },
  { icon: Bell, title: "Price Alerts", desc: "Set your target price and get notified the moment a part drops to what you want to pay." },
  { icon: Bookmark, title: "My Garage", desc: "Save your vehicles and instantly filter every search to compatible parts." },
  { icon: Star, title: "Community Reviews", desc: "Real ratings from real buyers help you pick the best parts and suppliers." },
];

const reasons = [
  {
    icon: Users,
    title: "Built for Everyone",
    desc: "Whether you're a weekend DIY-er, a professional mechanic, or managing a fleet — PARTARA adapts to how you work.",
  },
  {
    icon: Clock,
    title: "Save Hours, Not Just Money",
    desc: "Stop opening 10 tabs to compare prices. One search gives you everything you need in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Always Up to Date",
    desc: "Live pricing and stock data means you're never surprised at checkout. What you see is what you get.",
  },
  {
    icon: Shield,
    title: "Privacy-First & UK Compliant",
    desc: "Fully GDPR-compliant. Your data stays yours — we never sell it or share it with third parties.",
  },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="About PARTARA"
      description="Learn how PARTARA is revolutionising car part search in the UK. Search 1,000,000+ parts from trusted suppliers with photo search and reg plate lookup."
      path="/about"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About PARTARA",
        "url": "https://car-part-search.lovable.app/about",
        "description": "Learn how PARTARA is revolutionising car part search in the UK."
      }}
    />
    <Navbar />
    <main className="pt-24 pb-16">
      {/* Our Story */}
      <section className="container px-4 mb-24 max-w-4xl mx-auto text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Our Story
        </span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
          Making Car Parts Search{" "}
          <span className="text-primary">Simple</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-6">
          PARTARA was born out of frustration. Finding the right car part used to mean hours of
          searching across dozens of supplier websites, comparing prices in spreadsheets, and
          hoping you'd picked a trustworthy source.
        </p>
        <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
          We built PARTARA to fix that. As a UK-based platform built by car enthusiasts and engineers, we
          created a platform that lets you search by part name, vehicle reg plate, or even a photo —
          then compare prices across trusted UK &amp; global suppliers, browse a verified marketplace, set price alerts,
          and manage your garage — all in one place.
        </p>
      </section>

      {/* Mission */}
      <section className="relative mb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.03] to-transparent" />
        <div className="container px-4 py-16 md:py-20 max-w-4xl mx-auto relative">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4 w-full text-center">
            Our Mission
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 text-center">
            Car Parts, Without the Hassle
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-muted-foreground leading-relaxed">
            <p>
              Our mission is to make finding car parts as easy as searching the web. We believe
              every driver — whether you're maintaining a family car or running a busy workshop —
              deserves fast access to the right part at a fair price.
            </p>
            <p>
              We're building the most comprehensive parts platform in the UK, connecting buyers
              to trusted suppliers and verified sellers. Transparent pricing, real availability,
              community reviews, and zero hidden fees — that's the PARTARA promise.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container px-4 mb-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            How It Works
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Three Simple Steps
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="absolute top-4 right-4 text-[3rem] font-black text-muted/30 leading-none select-none">
                {i + 1}
              </span>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon size={26} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us — unique selling points */}
      <section className="container px-4 mb-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            What Sets Us Apart
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Features Built for Real Drivers
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why PARTARA */}
      <section className="container px-4 mb-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Why PARTARA
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            The Smarter Way to Find Parts
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="flex gap-5 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <r.icon size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container px-4 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-border bg-card p-10 md:p-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Ready to Find Your Part?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of drivers and mechanics who save time and money with PARTARA.
          </p>
          <Link to="/">
            <Button size="lg" className="rounded-xl px-8">
              Start Searching
            </Button>
          </Link>
        </div>
      </section>
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default About;
