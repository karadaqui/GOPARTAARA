import { Link } from "react-router-dom";

const PARTS = [
  { emoji: "🛑", name: "Brake Pads", info: "From £12.99 · Up to 60% off" },
  { emoji: "🔧", name: "Oil Filters", info: "From £4.99 · Up to 45% off" },
  { emoji: "⚡", name: "Spark Plugs", info: "From £3.49 · Up to 50% off" },
  { emoji: "🔩", name: "Timing Belts", info: "From £18.99 · Up to 35% off" },
  { emoji: "💡", name: "Headlight Bulbs", info: "From £6.99 · Up to 55% off" },
  { emoji: "🛞", name: "Tyres", info: "From £39.99 · Compare 5 suppliers" },
];

const FeaturedPartsSection = () => {
  return (
    <section className="py-12 sm:py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
            THIS WEEK
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Featured Parts This Week
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Hand-picked deals across the most-searched parts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTS.map((p) => (
            <div
              key={p.name}
              className="group relative bg-card border border-border rounded-2xl p-5 hover:border-foreground/20 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl" aria-hidden="true">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.info}</p>
                </div>
              </div>
              <Link
                to={`/search?q=${encodeURIComponent(p.name)}`}
                className="inline-flex items-center justify-center w-full px-3 py-2 bg-secondary hover:bg-secondary/70 text-foreground text-sm font-medium rounded-lg transition-colors"
              >
                Search →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPartsSection;
