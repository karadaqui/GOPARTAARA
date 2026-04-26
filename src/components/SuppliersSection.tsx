import { Package, Search, Zap, Globe } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const stats = [
  {
    icon: Package,
    number: "1,000,000+",
    label: "Parts Available",
    subtext: "Updated daily from eBay",
  },
  {
    icon: Search,
    number: "Free",
    label: "To Search & Compare",
    subtext: "No account needed to browse",
  },
  {
    icon: Zap,
    number: "Real-time",
    label: "Live Prices",
    subtext: "Direct from eBay marketplace",
  },
  {
    icon: Globe,
    number: "Global",
    label: "eBay Markets",
    subtext: "UK, EU, US, AU & more",
  },
];

const SuppliersSection = () => (
  <section className="relative py-12 md:py-16">
    {/* Subtle glow behind section */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px]" />
    </div>

    {/* Separator */}
    <div className="container px-4 mb-16">
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>

    <div className="container relative z-10 px-4">
      <ScrollReveal className="text-center mb-10">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight inline-block">
          The Numbers
        </h2>
        <div className="mt-3 mx-auto w-12 h-0.5 rounded-full bg-primary" />
      </ScrollReveal>

      <ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-6 text-center transition-[colors,transform] hover:border-primary/20 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
            >
              <s.icon
                size={20}
                className="mx-auto mb-3 text-primary transition-transform duration-300 group-hover:scale-110"
              />
              <div className="font-display text-2xl sm:text-3xl font-bold text-primary mb-1 tracking-tight">
                {s.number}
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                {s.label}
              </div>
              <div className="text-xs text-muted-foreground">{s.subtext}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default SuppliersSection;
