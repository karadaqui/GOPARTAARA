interface GreenSparkResultsRowProps {
  searchQuery: string;
  variant?: "row" | "grid";
}

const GSP_BASE =
  "https://www.awin1.com/cread.php?awinmid=16976&awinaffid=2845282&clickref=partara&p=";

const buildGspUrl = (path: string) =>
  `${GSP_BASE}${encodeURIComponent(`https://www.gsparkplug.com${path}`)}`;

const buildGspSearchUrl = (q: string) =>
  `${GSP_BASE}${encodeURIComponent(
    `https://www.gsparkplug.com/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  )}`;

interface GspProduct {
  id: string;
  title: string;
  price: string;
  priceNote: string;
  shipping: string;
  badge: string;
  url: string;
}

const GSP_FEATURED_PRODUCTS: GspProduct[] = [
  {
    id: "gsp-1",
    title: "NGK Spark Plug Range — Classic & Vintage Engines",
    price: "£4.50",
    priceNote: "from",
    shipping: "Free UK delivery over £59",
    badge: "Classic Specialist",
    url: buildGspUrl("/spark-plugs"),
  },
  {
    id: "gsp-2",
    title: "Ignition Coils — Classic Car & Motorcycle",
    price: "£29.99",
    priceNote: "from",
    shipping: "Free UK delivery over £59",
    badge: "Made in England",
    url: buildGspUrl("/ignition-coils"),
  },
  {
    id: "gsp-3",
    title: "Contact Sets & Condensers — Points Ignition",
    price: "£8.50",
    priceNote: "from",
    shipping: "Free UK delivery over £59",
    badge: "OE Quality",
    url: buildGspUrl("/contact-sets"),
  },
  {
    id: "gsp-4",
    title: "HT Leads & Ignition Wiring Kits",
    price: "£14.95",
    priceNote: "from",
    shipping: "Free UK delivery over £59",
    badge: "Ships Worldwide",
    url: buildGspUrl("/ht-leads"),
  },
];

const GreenSparkResultsRow = ({ searchQuery, variant = "row" }: GreenSparkResultsRowProps) => {
  const searchOnSiteUrl = buildGspSearchUrl(searchQuery);

  return (
    <section className="mb-10 mt-2 animate-fade-in">
      {/* Section header + shared trust line */}
      <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500/70 mb-1">
            CLASSIC & VINTAGE SPECIALIST
          </p>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            🔩 The Green Spark Plug Co.
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-amber-400">★★★★★</span> 5.0 on Trustpilot · 3,649+ reviews · Ships worldwide · Est. 1980
          </p>
        </div>

        <a
          href={searchOnSiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-700/40 bg-amber-950/20 text-amber-400 hover:text-amber-300 hover:border-amber-500/60 text-xs font-semibold transition-colors"
        >
          Search "{searchQuery}" on their site →
        </a>
      </div>

      {/* Product grid */}
      <div
        className={
          variant === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
        }
      >
        {GSP_FEATURED_PRODUCTS.map((product) => (
          <a
            key={product.id}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${product.title} — Green Spark Plug Co. affiliate`}
            className="group rounded-2xl p-4 border border-amber-800/30 bg-amber-950/10 hover:border-amber-600/40 hover:bg-amber-950/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-[colors,transform] flex flex-col"
          >
            {/* Supplier tag */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🔩</span>
              <span className="text-[10px] font-semibold text-amber-400 truncate">
                Green Spark Plug Co.
              </span>
              <span className="ml-auto text-[10px] bg-amber-900/40 border border-amber-700/30 text-amber-500 rounded-full px-2 py-0.5 whitespace-nowrap">
                {product.badge}
              </span>
            </div>

            {/* Title */}
            <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
              {product.title}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xs text-muted-foreground">{product.priceNote}</span>
              <span className="text-lg font-bold text-foreground">{product.price}</span>
            </div>

            {/* Shipping */}
            <p className="text-[11px] text-muted-foreground mb-1">{product.shipping}</p>
            <p className="text-[10px] text-muted-foreground mb-3">🌍 Ships worldwide</p>

            {/* CTA */}
            <span className="mt-auto block w-full text-center py-2 bg-amber-600/20 group-hover:bg-amber-600/30 border border-amber-700/30 text-amber-400 text-xs font-semibold rounded-xl transition-colors">
              View on Green Spark Plug Co. →
            </span>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Affiliate link — we may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

export default GreenSparkResultsRow;
