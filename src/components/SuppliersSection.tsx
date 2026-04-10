import ScrollReveal from "@/components/ScrollReveal";

const suppliers = [
  "eBay UK",
  "Amazon UK",
  "Euro Car Parts",
  "GSF Car Parts",
  "Car Parts 4 Less",
  "Autodoc",
];

const SuppliersSection = () => (
  <section className="py-20 md:py-24 border-y border-border/40">
    <div className="container px-4">
      <ScrollReveal className="text-center mb-12">
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          Trusted Suppliers
        </span>
        <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight">
          Search 1,000,000+ Parts From Trusted Suppliers
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {suppliers.map((s) => (
            <span
              key={s}
              className="px-5 py-2.5 rounded-full border border-border/50 bg-secondary/20 backdrop-blur-sm text-xs sm:text-sm font-medium text-muted-foreground pill-glow"
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
