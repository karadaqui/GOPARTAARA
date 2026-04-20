import { Search, BarChart3, ShoppingCart, Bell } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  {
    icon: Search,
    number: "1",
    title: "Search",
    desc: "Type a part name, upload a photo, or enter your reg plate. We'll handle the rest.",
  },
  {
    icon: BarChart3,
    number: "2",
    title: "Compare",
    desc: "See prices from trusted UK &amp; global suppliers side by side. Filter by price, rating, and availability.",
  },
  {
    icon: ShoppingCart,
    number: "3",
    title: "Save",
    desc: "Order directly from your chosen supplier. No middleman, no markup — just the best deal.",
  },
  {
    icon: Bell,
    number: "4",
    title: "Save More",
    desc: "Set price alerts and get notified when parts drop to your target price. Never overpay again.",
  },
];

const HowItWorksSection = () => (
  <section className="py-24 md:py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
    <div className="container px-4 relative">
      <ScrollReveal className="text-center mb-16">
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          How It Works
        </span>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          Four Simple Steps
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Finding the right car part shouldn't take hours. With PARTARA, it takes seconds.
        </p>
      </ScrollReveal>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {steps.map((s, i) => (
          <ScrollReveal key={s.title} delay={i + 1}>
            <div className="relative text-center group">
              <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <s.icon size={30} />
              </div>
              <span className="absolute -top-2 -right-2 md:top-0 md:right-4 text-6xl font-black text-muted/15 select-none">
                {s.number}
              </span>
              <h3 className="font-display text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
