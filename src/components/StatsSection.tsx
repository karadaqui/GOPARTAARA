import ScrollReveal from "@/components/ScrollReveal";

const stats = [
  { value: "1M+", label: "Parts Searchable" },
  { value: "6+", label: "Trusted Suppliers" },
  { value: "100%", label: "Free to Search" },
];

const StatsSection = () => (
  <section className="py-20 md:py-24">
    <div className="container px-4">
      <ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tight transition-transform duration-300 group-hover:scale-110">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default StatsSection;
