import ScrollReveal from "@/components/ScrollReveal";

const stats = [
  { value: "1M+", label: "Parts Available" },
  { value: "Free", label: "Always Free to Search" },
  { value: "Real-time", label: "Live Prices" },
  { value: "UK & Global", label: "Suppliers Connected" },
];

const suppliers = [
  "eBay UK",
  "Amazon UK",
  "Euro Car Parts",
  "GSF Car Parts",
  "Car Parts 4 Less",
  "Autodoc",
];

const SuppliersSection = () => (
  <section className="py-20 md:py-28">
    {/* Separator */}
    <div className="container px-4 mb-16">
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>

    <div className="container px-4">
      {/* Stats grid */}
      <ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto mb-20">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-1.5 tracking-tight transition-transform duration-300 group-hover:scale-105">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Section title */}
      <ScrollReveal className="text-center mb-10">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight inline-block">
          Trusted Suppliers
        </h2>
        <div className="mt-3 mx-auto w-12 h-0.5 rounded-full bg-primary" />
      </ScrollReveal>

      {/* Supplier row */}
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {suppliers.map((s) => (
            <span
              key={s}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5 cursor-default"
            >
              {s}
            </span>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default SuppliersSection;
