import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Zap, Shield, Globe, CheckCircle2, Users, Clock, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search or Snap",
    desc: "Type your part name, vehicle reg, or upload a photo of the part you need. Our advanced system handles the rest.",
  },
  {
    icon: Zap,
    title: "Instant Comparison",
    desc: "We scan 15+ trusted UK and global suppliers simultaneously, pulling real-time prices and availability.",
  },
  {
    icon: Shield,
    title: "Choose with Confidence",
    desc: "Compare results by price, quality rating, delivery speed, and supplier reputation — all in one view.",
  },
  {
    icon: Globe,
    title: "Order Direct",
    desc: "Click through to your chosen supplier and complete your purchase. No middleman, no markup.",
  },
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
    <Navbar />
    <main className="pt-24 pb-16">
      {/* Hero / Our Story */}
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
          We built PARTARA to fix that. As a UK-based team of car enthusiasts and engineers, we
          created a single search engine that aggregates results from trusted suppliers — so you
          can find, compare, and buy the right part in minutes, not hours.
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
              We're building the most comprehensive parts search engine in the UK, connecting you
              to a growing network of 15+ trusted suppliers. Transparent pricing, real availability,
              and zero hidden fees — that's the PARTARA promise.
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
            Four Steps to the Right Part
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute top-4 right-4 text-[3rem] font-black text-muted/30 leading-none select-none">
                {i + 1}
              </div>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon size={26} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
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
          <a
            href="/#search"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Searching
          </a>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default About;
