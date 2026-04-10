const stats = [
  { value: "1M+", label: "Parts Searchable" },
  { value: "6+", label: "Trusted Suppliers" },
  { value: "100%", label: "Free to Search" },
];

const StatsSection = () => (
  <section className="py-16 md:py-20">
    <div className="container px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
              {s.value}
            </div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
