interface GreenSparkFeaturedCardProps {
  searchQuery: string;
}

const CLASSIC_KEYWORDS = [
  "spark plug", "ignition", "coil", "distributor",
  "contact set", "condenser", "rotor arm", "ht lead",
  "battery", "classic", "vintage", "veteran", "dynamo",
  "starter motor", "fuel pump", "carburettor", "carburetor",
  "points", "timing", "wiring", "alternator",
];

export const isClassicPartSearch = (query: string): boolean => {
  const q = query.toLowerCase();
  return CLASSIC_KEYWORDS.some((kw) => q.includes(kw));
};

const GreenSparkFeaturedCard = ({ searchQuery }: GreenSparkFeaturedCardProps) => {
  const affiliateUrl = `https://www.awin1.com/cread.php?awinmid=16976&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(
    "https://www.gsparkplug.com/?q=" + searchQuery,
  )}`;

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="The Green Spark Plug Co. — featured specialist supplier"
      className="flex items-center gap-4 p-4 mb-4 rounded-2xl border border-amber-800/30 bg-amber-950/15 hover:border-amber-600/40 hover:bg-amber-950/25 transition-all group"
    >
      {/* Supplier badge */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center text-xl">
        🔩
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-bold text-foreground">
            The Green Spark Plug Co.
          </p>
          <span className="text-[10px] bg-amber-900/40 border border-amber-700/30 text-amber-400 rounded-full px-2 py-0.5">
            Specialist Supplier
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Classic & vintage parts specialist · 25,000+ products · Ships worldwide · Est. 1980
        </p>
        <p className="text-xs text-amber-500/70 mt-0.5">
          NGK · Bosch · Denso · Champion · Lucas · Remax
        </p>
      </div>

      {/* Price hint + CTA */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        <p className="text-xs text-muted-foreground mb-1">
          Free UK delivery £59+
        </p>
        <div className="flex items-center justify-end gap-1 text-amber-400 group-hover:text-amber-300 transition-colors">
          <span className="text-xs font-semibold">Shop now</span>
          <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </a>
  );
};

export default GreenSparkFeaturedCard;
