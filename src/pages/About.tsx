import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Zap, Shield, Globe } from "lucide-react";

const steps = [
  { icon: Search, title: "Search", desc: "Enter your vehicle details and the part you need." },
  { icon: Zap, title: "Compare", desc: "We scan trusted UK and global suppliers in seconds." },
  { icon: Shield, title: "Choose", desc: "Pick the best option by price, quality, or delivery." },
  { icon: Globe, title: "Order", desc: "Go directly to the supplier and complete your purchase." },
];

const reasons = [
  "Trusted UK & global supplier network",
  "AI-powered part identification from photos",
  "Real-time price comparison across suppliers",
  "Save and track parts across sessions",
  "Built for both trade and retail customers",
  "GDPR-compliant and privacy-first",
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="container px-4 mb-20 text-center max-w-3xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
          About <span className="text-primary">PART</span>ARA
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Partara is a UK-based car parts search engine that helps drivers, mechanics, and trade
          professionals find the right parts at the best prices — fast. We aggregate results from
          trusted suppliers so you can compare, choose, and buy with confidence.
        </p>
      </section>

      {/* Mission */}
      <section className="container px-4 mb-20 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl font-bold mb-4 text-center">Our Mission</h2>
        <p className="text-muted-foreground text-center leading-relaxed">
          We believe finding car parts shouldn't be painful. Our mission is to make the process
          transparent, quick, and reliable — saving you time and money on every search. Whether
          you're a home mechanic or running a busy workshop, Partara puts the right part at your
          fingertips.
        </p>
      </section>

      {/* How it works */}
      <section className="container px-4 mb-20">
        <h2 className="font-display text-2xl font-bold mb-10 text-center">How PARTARA Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="rounded-xl border border-border bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <s.icon size={24} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Step {i + 1}</span>
              <h3 className="font-semibold mt-1 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="container px-4 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl font-bold mb-6 text-center">Why Choose PARTARA</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {r}
            </li>
          ))}
        </ul>
      </section>
    </main>
    <Footer />
  </div>
);

export default About;
