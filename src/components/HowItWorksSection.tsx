import { Search, BarChart3, ShoppingCart } from "lucide-react";

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
];

const HowItWorksSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
    <div className="container px-4 relative">
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          How It Works
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Three Simple Steps
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Finding the right car part shouldn't take hours. With PARTARA, it takes seconds.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((s) => (
          <div key={s.title} className="relative text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <s.icon size={28} />
            </div>
            <span className="absolute -top-2 -right-2 md:top-0 md:right-4 text-5xl font-black text-muted/20 select-none">
              {s.number}
            </span>
            <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
