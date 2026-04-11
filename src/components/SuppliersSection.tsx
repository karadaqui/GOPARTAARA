import ScrollReveal from "@/components/ScrollReveal";

const stats = [
  { value: "1M+", label: "Parts Available" },
  { value: "Free", label: "Always Free to Search" },
  { value: "Real-time", label: "Live Prices" },
  { value: "UK & Global", label: "Suppliers Connected" },
];

const activeSuppliers = [
  { name: "eBay UK", href: "https://www.ebay.co.uk" },
  { name: "Amazon UK", href: "https://www.amazon.co.uk" },
];

const comingSoonSuppliers = [
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
          {/* Active suppliers */}
          {activeSuppliers.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5"
            >
              {s.name}
            </a>
          ))}

          {/* Coming soon suppliers */}
          {comingSoonSuppliers.map((s) => (
            <span
              key={s}
              className="relative px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-border/20 bg-card/15 backdrop-blur-sm text-xs sm:text-sm font-medium text-muted-foreground/50 cursor-default opacity-50 grayscale select-none"
            >
              {s}
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider whitespace-nowrap leading-none">
                Coming Soon
              </span>
            </span>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default SuppliersSection;
