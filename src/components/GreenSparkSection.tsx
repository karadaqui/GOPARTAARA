// Green Spark Plug Co. — global affiliate section (worldwide shipping)

const AFFILIATE_BASE =
  "https://www.awin1.com/cread.php?awinmid=16976&awinaffid=2845282&clickref=partara&p=";

const buildLink = (path: string) =>
  `${AFFILIATE_BASE}${encodeURIComponent(`https://www.greenspark.co.uk${path}`)}`;

const HOME_LINK = buildLink("/");

const CATEGORIES = [
  {
    icon: "🔌",
    label: "Spark Plugs",
    desc: "NGK, Bosch, Champion & more",
    badge: "5,000+ products",
    url: buildLink("/spark-plugs"),
  },
  {
    icon: "🔋",
    label: "Batteries",
    desc: "Classic & vintage batteries",
    badge: "Ships worldwide · UK, EU, USA, Australia & more",
    url: buildLink("/battery"),
  },
  {
    icon: "⚡",
    label: "Ignition & Wiring",
    desc: "Coils, distributors & leads",
    badge: "Est. 1980",
    url: buildLink("/wiring"),
  },
  {
    icon: "🛢️",
    label: "Oil & Fuel",
    desc: "Classic engine oils & fuel",
    badge: "30 day returns",
    url: buildLink("/oil"),
  },
  {
    icon: "🔧",
    label: "All Parts",
    desc: "Browse 25,000+ classic parts",
    badge: "25,000 products",
    url: buildLink("/"),
  },
];

const BRANDS = ["NGK", "Bosch", "Denso", "Champion", "Beru", "Sealey", "Lucas", "Draper"];

const GreenSparkSection = () => {

  return (
    <section className="px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500/60 mb-1">
            CLASSIC & VINTAGE · WORLDWIDE SHIPPING
          </p>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            🔩 Classic & Vintage Car Parts
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            Worldwide shipping · Classic & vintage parts since 1980
          </p>
        </div>

        <a
          href={HOME_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600/20 to-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-sm font-semibold text-amber-400 hover:text-amber-300 transition-all duration-200"
        >
          Visit Store →
        </a>
      </div>

      {/* Category cards */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x -mx-4 px-4">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.label}
            href={cat.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${cat.label} — Green Spark Plug Co. affiliate`}
            className="flex-shrink-0 w-44 snap-start rounded-2xl p-4 border border-amber-900/30 bg-amber-950/10 hover:border-amber-700/40 hover:bg-amber-950/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 group cursor-pointer"
          >
            <div className="text-2xl mb-3">{cat.icon}</div>

            <p className="font-bold text-foreground text-sm leading-snug mb-1 group-hover:text-amber-400 transition-colors">
              {cat.label}
            </p>

            <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">
              {cat.desc}
            </p>

            <div className="inline-flex items-center gap-1 mb-2">
              <span className="text-[10px] text-amber-500/70 bg-amber-950/40 border border-amber-800/30 rounded-full px-2 py-0.5">
                {cat.badge}
              </span>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
              <span className="text-[10px]">Shop now</span>
              <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </a>
        ))}
      </div>

      {/* Brands */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-[10px] text-muted-foreground">Brands:</span>
        {BRANDS.map((brand) => (
          <span
            key={brand}
            className="text-[10px] text-muted-foreground bg-secondary/60 border border-border/60 rounded-full px-2 py-0.5"
          >
            {brand}
          </span>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground mt-3">
        Powered by The Green Spark Plug Co. · UK only · Affiliate links — we may earn a small commission.
      </p>
    </section>
  );
};

export default GreenSparkSection;
