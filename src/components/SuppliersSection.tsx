import ScrollReveal from "@/components/ScrollReveal";

const stats = [
  { value: "1M+", label: "Parts Indexed" },
  { value: "£0", label: "Always Free to Search" },
  { value: "Real-time", label: "Live Price Updates" },
  { value: "10+", label: "Trusted Suppliers" },
];

const activeSuppliers = [
  { name: "eBay UK", href: "https://www.ebay.co.uk" },
];

const comingSoonSuppliers = [
  "Euro Car Parts",
  "GSF Car Parts",
  "Car Parts 4 Less",
  "Autodoc",
  "Amazon UK",
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
        <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
          {/* Active suppliers */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {activeSuppliers.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm text-sm sm:text-base font-semibold text-foreground transition-all duration-300 hover:border-primary/30 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5"
              >
                {s.name}
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">plus</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Coming soon - muted */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground/60 mb-3">More suppliers joining soon</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {comingSoonSuppliers.map((s) => (
                <span
                  key={s}
                  className="px-3.5 py-1.5 rounded-lg border border-border/15 bg-card/10 text-[11px] font-medium text-muted-foreground/30 cursor-default select-none"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default SuppliersSection;
