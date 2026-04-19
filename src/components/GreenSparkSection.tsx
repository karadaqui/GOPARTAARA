// Green Spark Plug Co. — global affiliate section (worldwide shipping)

const AFFILIATE_BASE =
  "https://www.awin1.com/cread.php?awinmid=16976&awinaffid=2845282&clickref=partara&p=";

const buildLink = (path: string) =>
  `${AFFILIATE_BASE}${encodeURIComponent(`https://www.greenspark.co.uk${path}`)}`;

const HOME_LINK = buildLink("/");

const QUICK_CATS = ["Spark Plugs", "Batteries", "Ignition", "Oil & Fuel"];

const GreenSparkSection = () => {
  return (
    <section className="py-4 px-4 max-w-5xl mx-auto">
      <a
        href={HOME_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Classic & Vintage Car Parts — Green Spark Plug Co."
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-950/30 to-card/60 border border-amber-900/30 hover:border-amber-800/50 rounded-2xl transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-900/30 flex items-center justify-center flex-shrink-0 text-xl">
          🔩
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-foreground font-bold text-sm">Classic & Vintage Car Parts</p>
            <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full px-1.5 py-0.5 font-bold">
              EST. 1980
            </span>
          </div>
          <p className="text-muted-foreground text-xs truncate">
            NGK · Bosch · Denso · Champion — Ships worldwide · 25,000+ parts
          </p>
        </div>

        <div className="hidden sm:flex gap-1.5 flex-shrink-0">
          {QUICK_CATS.map((cat) => (
            <span
              key={cat}
              className="text-[10px] bg-secondary/60 border border-border text-muted-foreground rounded-lg px-2 py-1"
            >
              {cat}
            </span>
          ))}
        </div>

        <span className="text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-all group-hover:translate-x-0.5">
          →
        </span>
      </a>
      <p className="text-muted-foreground/60 text-[10px] text-center mt-2">
        Powered by The Green Spark Plug Co. · Affiliate link
      </p>
    </section>
  );
};

export default GreenSparkSection;
