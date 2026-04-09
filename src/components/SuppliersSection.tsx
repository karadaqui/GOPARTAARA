const suppliers = [
  "eBay UK",
  "Amazon UK",
  "Euro Car Parts",
  "GSF Car Parts",
  "Car Parts 4 Less",
  "Autodoc",
];

const SuppliersSection = () => (
  <section className="py-16 md:py-20 border-y border-border">
    <div className="container px-4">
      <div className="text-center mb-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Trusted Suppliers
        </span>
        <h2 className="font-display text-2xl md:text-3xl font-bold">
          We Search Across 6+ Suppliers
        </h2>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
        {suppliers.map((s) => (
          <span
            key={s}
            className="px-4 py-2 rounded-full border border-border bg-secondary/30 text-xs font-medium text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default SuppliersSection;
